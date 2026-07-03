# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
