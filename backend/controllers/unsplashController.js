import logger from '../utils/logger.js';
import Article from '../models/Article.js';
import Image from '../models/Image.js';
import ImageService from '../services/ImageService.js';

const getAccessKey = () => {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new Error('Unsplash is not configured. Set UNSPLASH_ACCESS_KEY in your environment.');
  return key;
};

// @desc    Search Unsplash photos (proxied to keep key secret)
// @route   GET /api/images/unsplash/search?query=...&page=1
// @access  Private
export const searchUnsplash = async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    if (!query?.trim()) return res.status(400).json({ error: 'query parameter is required.' });

    const accessKey = getAccessKey();

    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query.trim());
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', '20');
    url.searchParams.set('orientation', 'landscape');

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });

    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).json({ error: `Unsplash API error: ${body}` });
    }

    const data = await response.json();

    const photos = data.results.map((p) => ({
      id: p.id,
      urls: {
        regular: p.urls.regular,
        small:   p.urls.small,
        thumb:   p.urls.thumb,
      },
      description: p.alt_description || p.description || '',
      downloadLocation: p.links.download_location,
      photographer: {
        name: p.user.name,
        url:  p.user.links.html,
      },
    }));

    res.json({ total: data.total, totalPages: data.total_pages, photos });
  } catch (err) {
    if (err.message.includes('not configured')) return res.status(503).json({ error: err.message });
    logger.error('UNSPLASH SEARCH ERROR:', err);
    res.status(500).json({ error: 'Failed to search Unsplash.' });
  }
};

// @desc    Download an Unsplash photo and set it as article cover (uploads to S3)
// @route   POST /api/articles/:id/cover-unsplash
// @access  Private
export const setUnsplashCover = async (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrl, downloadLocation, photographerName, photographerUrl } = req.body;

    if (!photoUrl) return res.status(400).json({ error: 'photoUrl is required.' });

    const accessKey = getAccessKey();

    const article = await Article.findOne({ _id: id, user: req.user.id });
    if (!article) return res.status(404).json({ error: 'Article not found or access denied.' });

    // Trigger Unsplash download event — required by Unsplash API guidelines
    if (downloadLocation) {
      fetch(`${downloadLocation}?client_id=${accessKey}`).catch(() => {});
    }

    // Download the photo
    const fetchResponse = await fetch(photoUrl);
    if (!fetchResponse.ok) {
      return res.status(500).json({ error: 'Failed to download photo from Unsplash.' });
    }
    const imageBuffer = Buffer.from(await fetchResponse.arrayBuffer());

    // Delete previous cover if exists
    if (article.coverImageId) {
      const oldImage = await Image.findById(article.coverImageId);
      if (oldImage) {
        await ImageService.deleteImagePaths(
          [oldImage.path, oldImage.thumbnails?.small, oldImage.thumbnails?.medium, oldImage.thumbnails?.large]
            .filter(Boolean)
        );
        await oldImage.deleteOne();
      }
    }

    // Reuse the existing ImageService pipeline (resize, WebP, S3)
    const mockFile = { buffer: imageBuffer, mimetype: 'image/jpeg' };
    const uploadResult = await ImageService.uploadImage(mockFile, 'unsplash-covers');

    const imageDoc = await Image.create({
      url: '',
      path: uploadResult.path,
      filename: uploadResult.filename,
      imageableId: article._id,
      imageableType: 'Article',
      isPrimary: true,
      thumbnails: uploadResult.thumbnails,
      size: uploadResult.size,
      mimetype: uploadResult.mimetype,
    });

    imageDoc.url = `/api/images/${imageDoc._id}/view`;
    await imageDoc.save();

    article.coverImageId = imageDoc._id;
    await article.save();

    const coverUrl = await ImageService.getSignedUrl(uploadResult.thumbnails.medium, 3600);

    res.json({
      success: true,
      coverImageId: imageDoc._id,
      coverUrl,
      credit: { photographerName, photographerUrl },
    });
  } catch (err) {
    if (err.message.includes('not configured')) return res.status(503).json({ error: err.message });
    logger.error('UNSPLASH COVER ERROR:', err);
    res.status(500).json({ error: 'Failed to set Unsplash cover image.' });
  }
};
