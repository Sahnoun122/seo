import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// react-i18next's real setup fetches translations over HTTP (i18next-http-backend),
// which never resolves under jsdom/Vitest — every t() call would return the raw
// key. Mock it globally with a synchronous lookup against the real en/ JSON, so
// component tests see the actual English copy instead of dotted key strings.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enTranslations = JSON.parse(
  readFileSync(path.resolve(__dirname, '../public/locales/en/translation.json'), 'utf8')
);

const resolveKey = (key) => key.split('.').reduce((obj, part) => obj?.[part], enTranslations);

const interpolate = (str, vars) =>
  typeof str === 'string' && vars
    ? str.replace(/\{\{(\w+)\}\}/g, (_, name) => (vars[name] !== undefined ? vars[name] : `{{${name}}}`))
    : str;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const resolved = resolveKey(key);
      if (resolved === undefined) return options?.defaultValue ?? key;
      if (options?.returnObjects) return resolved;
      return interpolate(resolved, options);
    },
    i18n: {
      language: 'en',
      resolvedLanguage: 'en',
      dir: () => 'ltr',
      changeLanguage: vi.fn(),
    },
  }),
  Trans: ({ children }) => children ?? null,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Mock matchMedia (not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.location.href setter (used in api.js auto-logout)
delete window.location;
window.location = { href: '', pathname: '/' };

// Mock IntersectionObserver (used by Framer Motion)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
