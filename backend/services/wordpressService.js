/**
 * WordPressService — Handles all WordPress REST API interactions.
 *
 * Features:
 *   • Redirect-safe POST requests (prevents POST→GET downgrade)
 *   • Featured image upload to the WP Media Library
 *   • Tag creation from SEO keywords
 *   • AIOSEO meta fields (focus keyword, meta description)
 */

import logger from '../utils/logger.js';

class WordPressService {
  /**
   * @param {Object} opts
   * @param {string} opts.siteUrl   — WordPress site URL (e.g. https://example.com)
   * @param {string} opts.username  — WordPress username
   * @param {string} opts.appPassword — WordPress Application Password
   */
  constructor({ siteUrl, username, appPassword }) {
    let base = siteUrl.trim();
    if (!base.startsWith('http://') && !base.startsWith('https://')) {
      base = `https://${base}`;
    }
    this.baseUrl = base.replace(/\/+$/, '');
    this.authHeader = `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`;
  }

  // ── Core HTTP helper ────────────────────────────────────────────────────────

  /**
   * Send a redirect-safe request to the WordPress REST API.
   * Follows up to 5 redirects while keeping the original HTTP method.
   */
  async _request(endpoint, { method = 'GET', headers = {}, body } = {}) {
    const url = `${this.baseUrl}/wp-json/wp/v2${endpoint}`;
    const reqHeaders = { Authorization: this.authHeader, ...headers };

    let response = await fetch(url, { method, headers: reqHeaders, body, redirect: 'manual' });

    // Follow redirects manually to preserve POST method
    let redirects = 0;
    while ([301, 302, 307, 308].includes(response.status) && redirects < 5) {
      const location = response.headers.get('location');
      if (!location) break;
      logger.info(`[WP] Redirect ${response.status} → ${location}`);
      response = await fetch(location, { method, headers: reqHeaders, body, redirect: 'manual' });
      redirects++;
    }

    // Validate JSON response
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const raw = await response.text();
      logger.error(`[WP] Non-JSON response (${response.status}): ${raw.slice(0, 300)}`);
      throw new Error(`WordPress returned an unexpected response (HTTP ${response.status}). Verify your Site URL and credentials.`);
    }

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.message || JSON.stringify(data);
      logger.error(`[WP] API error (${response.status}):`, msg);
      const err = new Error(msg);
      err.status = response.status;
      throw err;
    }

    return data;
  }

  // ── Media upload ────────────────────────────────────────────────────────────

  /**
   * Upload an image buffer to the WordPress Media Library.
   * @param {Buffer}  buffer      — raw image bytes
   * @param {string}  filename    — e.g. "cover.webp"
   * @param {string}  contentType — e.g. "image/webp"
   * @param {string}  [altText]   — alt attribute for SEO
   * @returns {number} WordPress media attachment ID
   */
  async uploadMedia(buffer, filename, contentType, altText = '') {
    const data = await this._request('/media', {
      method: 'POST',
      headers: {
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Type': contentType,
      },
      body: buffer,
    });

    // Set alt text for SEO (requires a second call)
    if (altText && data.id) {
      try {
        await this._request(`/media/${data.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alt_text: altText }),
        });
      } catch (e) {
        logger.warn(`[WP] Could not set alt text: ${e.message}`);
      }
    }

    return data.id;
  }

  // ── Tags ────────────────────────────────────────────────────────────────────

  /**
   * Ensure WordPress tags exist for the given keywords.
   * Creates missing tags and returns an array of tag IDs.
   * @param {string[]} keywords
   * @returns {number[]} tag IDs
   */
  async ensureTags(keywords) {
    if (!keywords?.length) return [];

    const tagIds = [];
    for (const keyword of keywords.slice(0, 10)) {
      try {
        // Search for existing tag
        const existing = await this._request(`/tags?search=${encodeURIComponent(keyword)}&per_page=1`);
        if (existing.length > 0) {
          tagIds.push(existing[0].id);
        } else {
          // Create new tag
          const created = await this._request('/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: keyword }),
          });
          tagIds.push(created.id);
        }
      } catch (e) {
        logger.warn(`[WP] Could not create/find tag "${keyword}": ${e.message}`);
      }
    }

    return tagIds;
  }

  // ── Post creation ───────────────────────────────────────────────────────────

  /**
   * Create a WordPress post with full SEO enrichment.
   *
   * @param {Object} opts
   * @param {string}   opts.title           — post title
   * @param {string}   opts.htmlContent     — post body (HTML)
   * @param {string}   opts.metaDescription — excerpt + AIOSEO description
   * @param {string}   opts.focusKeyword    — primary SEO keyword
   * @param {number[]} [opts.tagIds]        — WordPress tag IDs
   * @param {number}   [opts.featuredMediaId] — WordPress attachment ID
   * @param {string}   [opts.slug]          — URL slug
   * @returns {Object} { postId, postUrl, editUrl }
   */
  async createPost({ title, htmlContent, metaDescription, focusKeyword, tagIds = [], featuredMediaId, slug }) {
    const postPayload = {
      title,
      content: htmlContent,
      status: 'draft',
      excerpt: metaDescription,
      tags: tagIds,
    };

    if (featuredMediaId) {
      postPayload.featured_media = featuredMediaId;
    }

    if (slug) {
      postPayload.slug = slug;
    }

    // AIOSEO meta fields — set via the aioseo REST meta if the plugin is active.
    // These fields are stored in post meta and picked up by AIOSEO automatically.
    postPayload.meta = {
      _aioseo_title: title,
      _aioseo_description: metaDescription,
      _aioseo_keywords: focusKeyword,
      // Yoast SEO fallback fields (in case the site uses Yoast instead)
      _yoast_wpseo_title: title,
      _yoast_wpseo_metadesc: metaDescription,
      _yoast_wpseo_focuskw: focusKeyword,
    };

    const data = await this._request('/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postPayload),
    });

    return {
      postId: data.id,
      postUrl: data.link,
      editUrl: `${this.baseUrl}/wp-admin/post.php?post=${data.id}&action=edit`,
    };
  }
}

export default WordPressService;
