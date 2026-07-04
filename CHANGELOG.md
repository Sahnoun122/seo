# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-04

### Added
- **Cookie-based authentication**: JWT now lives in an httpOnly, SameSite cookie instead of `localStorage`, closing off token theft via XSS.
- **Logout endpoint**: `POST /api/auth/logout` clears the session cookie server-side.
- **AI model fallback chain**: free-tier OpenRouter models are retried against alternate free models on rate-limiting, stalls, or malformed responses, instead of failing the whole generation.
- **Regenerate keywords**: if keyword suggestion fails during generation, the article is still saved, and a new endpoint (`POST /api/articles/:id/regenerate-keywords`) lets the user retry that step alone.
- Full i18n parity across all 6 locales (ar, en, es, fr, it, zh) — 499/499 keys, no missing or placeholder strings.

### Fixed
- Landing page fully translated (previously ~95% hardcoded English despite claiming 6-language support).
- Marketplace ZIP build script now strips dev artifacts (`uploads/`, `scripts/`) and verifies no secrets/`.env` files are staged.
- Jest upgraded to 29.7.0 for ESM compatibility.
- `DEMO_MODE` env var allows reviewers to test generation without configuring a paid API key.

### Security
- CORS/cookie configuration hardened for cross-origin frontend/backend deployments (e.g. Vercel + Railway).

## [1.0.0] - 2026-06-21

### Added
- **AI SEO Generation**: Core engine using OpenAI API (GPT-4o/GPT-4o-mini) to generate long-form, optimized SEO articles with metadata.
- **Keyword Research**: Automatic generation of 5-10 related LSI and long-tail keywords for every primary keyword.
- **WordPress Integration**: 1-click publishing directly to WordPress sites via Application Passwords.
- **Stripe Subscriptions & Credits**: Full billing portal supporting one-time credit purchases and monthly recurring subscriptions (Idempotent Webhooks).
- **Admin Dashboard**: Comprehensive statistics, user management, and global system configuration.
- **Dark Mode**: Fully persistent theme switching utilizing Tailwind CSS dark variants and React Context.
- **Authentication System**: Secure JWT-based registration, login, and "Forgot Password" recovery flow.
- **Validation**: Strict schema enforcement using Zod for all API endpoints.
- **PDF/Markdown/HTML Export**: Save and download generated articles in multiple formats natively from the browser.
- **Test Coverage**: Initial Jest & Supertest integration covering core authentication and article generation pipelines.

### Security
- Removed debug logs exposing API credentials.
- Enforced strict environment variable dependencies (JWT_SECRET, OPENAI_API_KEY).
- Rate Limiting and Helmet integrations on Express server.

---
*Prepared for commercial release on Codester.*
