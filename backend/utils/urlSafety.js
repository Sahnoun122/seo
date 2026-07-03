import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * SSRF guard — resolves a URL's hostname and rejects it if it points to a
 * private, loopback, link-local, or cloud-metadata address. Use before any
 * server-side fetch() of a URL supplied (directly or indirectly) by a user.
 *
 * This does not fully eliminate DNS-rebinding races (the address could
 * change between this check and the actual fetch), but it blocks the
 * overwhelming majority of real-world SSRF payloads at negligible cost.
 */

const isPrivateIPv4 = (ip) => {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local + cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
};

const isPrivateIPv6 = (ip) => {
  const normalized = ip.toLowerCase();
  if (normalized === '::1') return true; // loopback
  if (normalized.startsWith('::ffff:')) return isPrivateIPv4(normalized.slice(7));
  if (normalized.startsWith('fe80:')) return true; // link-local
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local
  return false;
};

/**
 * @param {string} rawUrl
 * @throws {Error} if the URL is invalid, non-http(s), or resolves to a private address
 * @returns {URL} the parsed URL, for convenience
 */
const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

export const assertPublicHttpUrl = async (rawUrl) => {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw badRequest('Invalid URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw badRequest('Only http(s) URLs are allowed.');
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets
  if (hostname === 'localhost') {
    throw badRequest('Requests to localhost are not allowed.');
  }

  const addresses = net.isIP(hostname)
    ? [hostname]
    : (await dns.lookup(hostname, { all: true })).map((r) => r.address);

  for (const addr of addresses) {
    if ((net.isIPv4(addr) && isPrivateIPv4(addr)) || (net.isIPv6(addr) && isPrivateIPv6(addr))) {
      throw badRequest('Requests to private or internal network addresses are not allowed.');
    }
  }

  return parsed;
};

/**
 * @param {string} rawUrl
 * @returns {boolean} true if the hostname is unsplash.com or a subdomain of it
 */
export const isUnsplashHost = (rawUrl) => {
  try {
    const { hostname } = new URL(rawUrl);
    return hostname === 'unsplash.com' || hostname.endsWith('.unsplash.com');
  } catch {
    return false;
  }
};
