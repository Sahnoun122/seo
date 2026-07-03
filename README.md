# SEO Gen AI — Premium AI SEO Article Generator

[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express 5](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6%2B-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TailwindCSS 4](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![MinIO](https://img.shields.io/badge/MinIO-Object%20Storage-C72C48?logo=minio&logoColor=white)](https://min.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

**SEO Gen AI** is a complete, production-ready SaaS web application for generating SEO-optimized articles using AI. Built with React 19 + Vite on the frontend and Node.js/Express on the backend, it supports multiple AI models, WordPress publishing, Stripe subscriptions, a full admin panel, dark mode, and 6 interface languages.

---

## Key Features

### Content Generation
- **AI Article Generation** — One keyword → complete article (title, meta description, structured content, keyword suggestions) in seconds via Server-Sent Events (SSE) streaming
- **Multiple AI Models** — GPT-4o, DeepSeek, Groq, OpenRouter — users can bring their own API key for unlimited generation
- **Real-Time Streaming** — Content appears word by word as it is generated, with live progress indicators
- **Internal Linking Assistant** — Suggests contextually relevant internal links across your article library
- **Smart Keyword Suggestions** — Automatically surfaces 5–10 LSI and long-tail keywords per article

### Publishing & Export
- **1-Click WordPress Publishing** — Directly publishes drafted articles to any WordPress site via the REST API with featured image attached
- **Export Options** — Copy as Markdown, export as PDF, or download as HTML
- **Manual Cover Upload** — Upload any JPEG/PNG/WebP image; backend converts to WebP, generates 4 thumbnail sizes via Sharp, then stores on your chosen object storage
- **DALL-E 3 AI Cover Generation** — One click generates a professional cover image via DALL-E 3 (1792×1024), downloaded and stored in your configured storage backend
- **Multi-Provider Object Storage** — Supports **MinIO** (self-hosted, free, Docker-ready), **Cloudflare R2** (free 10 GB CDN), and **AWS S3** — switchable via environment variables with zero code changes. Includes `docker-compose.yml` to launch a full MinIO stack with a single command

### Platform & Monetization
- **Stripe Subscriptions** — Starter, Growth, and Pro monthly plans with automatic credit allocation
- **One-Time Credit Packs** — Users can purchase individual credit bundles from the Buy Credits page
- **Credit System** — Each generation consumes one credit; personal API key users get unlimited generations

### User Experience
- **Dark / Light Mode** — System-aware theme toggle, persisted across sessions
- **6 Interface Languages** — English, French, Spanish, Italian, Arabic, Chinese (i18next)
- **Fully Responsive** — Optimized for mobile, tablet, and desktop
- **Premium Animations** — Framer Motion transitions and loading skeletons throughout
- **Error Boundary** — Graceful error handling across all React routes

### Security & Admin
- **JWT Authentication** — Secure token-based auth with refresh flow
- **Password Reset** — Full forgot-password / reset-password email flow via Resend
- **AES-256 Encryption** — User API keys and WordPress passwords encrypted at rest
- **Rate Limiting** — Per-route rate limiters on auth and generation endpoints (express-rate-limit)
- **Helmet** — Secure HTTP headers in all environments
- **Admin Dashboard** — Real-time stats: total users, articles, credits, 30-day generation chart
- **User Manager** — Admin can view, promote, or delete any user
- **Role-Based Access Control** — `admin` vs `user` roles with protected admin routes
- **Zod Validation** — Schema-validated input on every API endpoint

### Legal & Compliance
- **Terms of Service** — 13-section CGU at `/terms`, included as a public route
- **Privacy Policy** — 12-section RGPD-compliant policy at `/privacy` including data processing table and GDPR rights table
- **Cookie Consent Banner** — localStorage-persisted consent (Essential only / Accept all) shown on first visit
- **GDPR Right to Erasure** — `DELETE /api/auth/account` cascading deletion: S3 images → Image docs → Articles → User
- **Standalone Legal HTML** — `documentation/legal.html` for marketplace listings and legal review

### API Documentation
- **Swagger UI** — Interactive OpenAPI 3.0.3 documentation auto-served at `/api/docs`
- **Raw JSON Spec** — Full OpenAPI spec downloadable at `/api/docs.json`
- **All Endpoints Documented** — Auth, Articles, Images, Settings, Admin, Payments — with schemas, examples, and JWT auth

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TailwindCSS 4, Framer Motion, i18next |
| Backend | Node.js 18+, Express 5, Mongoose 9 |
| Database | MongoDB (local or Atlas) |
| AI | OpenAI SDK (GPT-4o, OpenRouter, DeepSeek, Groq) |
| Payments | Stripe (subscriptions + one-time purchases + webhooks) |
| Storage | **MinIO** (self-hosted) / Cloudflare R2 (free) / AWS S3 — auto-detected via env vars |
| Auth | JWT + bcryptjs + AES-256 encryption |
| Testing Backend | Jest 29 + Supertest + mongodb-memory-server (125+ tests) |
| Testing Frontend | Vitest 4 + @testing-library/react (56+ tests) |
| CI/CD | GitHub Actions (ci.yml + security.yml) |
| API Docs | swagger-ui-express + OpenAPI 3.0.3 |
| Deploy | Vercel (frontend SPA) + Railway/Render (backend — see note below) |

---

## Requirements

- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free cluster
- **OpenAI API Key** — [platform.openai.com](https://platform.openai.com/api-keys) (or any compatible provider)
- **Stripe Account** (optional) — for payment features
- **AWS S3 Bucket** (optional) — for article image storage

---

## Project Structure

```
seo-gen-ai/
├── backend/                    # Express.js API server
│   ├── config/                 # DB and S3 configuration
│   ├── controllers/            # Route business logic
│   ├── middleware/             # Auth, rate limiter, error handler, upload
│   ├── models/                 # Mongoose schemas (User, Article, Image, Subscription...)
│   ├── routes/                 # API route definitions
│   ├── services/               # OpenAI, S3, internal linking services
│   ├── validators/             # Zod input validation schemas
│   ├── __tests__/              # Jest integration tests
│   ├── .env.example            # Backend environment variable template
│   └── server.js               # Application entry point
├── frontend/                   # React SPA (Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── pages/              # Route pages (Dashboard, History, Settings, Admin...)
│   │   ├── lib/                # Axios API client
│   │   └── i18n.js             # Internationalization setup
│   ├── public/locales/         # Translation files (en, fr, es, it, ar, zh)
│   └── .env.example            # Frontend environment variable template
├── documentation/
│   └── index.html              # Interactive HTML documentation portal
├── install.sh                  # One-click auto-installer script
├── package.json                # Root npm orchestrator (concurrent dev/start)
└── README.md                   # This file
```

---

## Demo Credentials (for Marketplace Reviewers)

Seed the database once, then log in instantly:

```bash
cd backend && node scripts/seed.js
```

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@seo.com` | `Admin1234!` |
| **User** | `john@example.com` | `Demo1234!` |

> The Admin account has access to the Admin Dashboard (`/admin/dashboard`) with real-time stats and user management. The User account has demo articles pre-loaded in the Content Library.

### Testing article generation without an AI key

Add `DEMO_MODE=true` to `backend/.env`. In this mode, every generation request returns a complete pre-built article **instantly** — no OpenAI key, no credits, no external API calls required. Perfect for reviewers who want to walk through the full generation → history → WordPress publish flow without configuring a paid API key.

```env
# backend/.env
DEMO_MODE=true
```

Remove or set to `false` before going to production.

---

## Quick Start

### Option A — Automatic (Recommended)

Run the included auto-installer from the project root. It checks prerequisites, copies `.env` templates, and installs all dependencies:

```bash
bash install.sh
```

Then configure `backend/.env` with your keys (see below) and start:

```bash
npm run dev
```

### Option B — Manual

```bash
# 1. Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Install dependencies
npm install
npm install --prefix backend
npm install --prefix frontend

# 3. Edit backend/.env with your credentials (see below)

# 4. Start both servers
npm run dev
```

**Frontend:** [http://localhost:5173](http://localhost:5173)  
**Backend API:** [http://localhost:5000/api](http://localhost:5000/api)

---

## Environment Variables

### `backend/.env`

```env
# Server
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/seo-article-generator

# Security — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_long_random_jwt_secret

# Encryption key — MUST be exactly 32 characters
ENCRYPTION_KEY=change_this_to_a_32_char_secret!!

# CORS — set to your frontend URL in production
CLIENT_URL=http://localhost:5173

# AI — OpenAI or compatible provider
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
# OPENAI_BASE_URL=https://openrouter.ai/api/v1  # Uncomment for OpenRouter

# Email — Resend (https://resend.com — free tier: 3,000 emails/month)
# Required for password reset emails to work
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Stripe (optional — disables payment features if omitted)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 (optional — disables image generation if omitted)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=your-bucket-name
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api

# Stripe subscription Price IDs (get from Stripe Dashboard → Products)
VITE_STRIPE_PRICE_STARTER=price_...
VITE_STRIPE_PRICE_GROWTH=price_...
VITE_STRIPE_PRICE_PRO=price_...
```

---

## Stripe Setup

1. Create products and prices in your [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Copy each **Price ID** (format: `price_1ABC...`) into `frontend/src/pages/Pricing.jsx` and `frontend/src/pages/BuyCredits.jsx`
3. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `backend/.env`
4. For webhooks: `stripe listen --forward-to localhost:5000/api/stripe/webhook`

---

## WordPress Integration

Users connect their WordPress site from the **Settings → Content Preferences** tab:

- **WordPress URL** — your site root, e.g. `https://myblog.com`
- **Username** — your WordPress login username
- **Application Password** — generate from *WordPress Admin → Users → Profile → Application Passwords*

Articles are published as drafts with the generated cover image as the featured image.

---

## Creating an Admin Account

1. Register a normal account via `/register`
2. Connect to MongoDB and update the user document:

```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

The admin navigation and dashboard will appear automatically on next login.

---

## Running Tests

### Backend (Jest — 125+ tests)

```bash
cd backend
npm test
```

Tests use an in-memory MongoDB instance — no external database required.

### Frontend (Vitest + RTL — 56+ tests)

```bash
cd frontend
npm test          # watch mode
npm test -- --run # single run with coverage report
```

### CI/CD (GitHub Actions)

Every push and pull request to `main` automatically runs both test suites and the frontend production build via `.github/workflows/ci.yml`. A weekly security audit runs every Monday via `.github/workflows/security.yml`.

---

## Production Build

```bash
# Build the frontend
npm run build:frontend

# Start backend in production mode
NODE_ENV=production npm start --prefix backend
```

For Vercel deployment, the included `backend/vercel.json` configures the serverless entry point automatically.

---

## API Documentation

Start the backend server and open [http://localhost:5000/api/docs](http://localhost:5000/api/docs) for the interactive Swagger UI. The raw OpenAPI 3.0.3 spec is available at `/api/docs.json`.

## Legal Pages

The platform ships with GDPR-compliant legal pages accessible as public routes:

| Route | Content |
|---|---|
| `/terms` | Terms of Service (13 sections) |
| `/privacy` | Privacy Policy — GDPR rights, data table, cookie policy |

A standalone printable HTML version of both documents is at `documentation/legal.html`. **Update the contact email addresses and jurisdiction before going live.**

## Documentation

Open `documentation/index.html` in any browser for the full interactive documentation portal (13 sections), including:

- Installation (auto and manual)
- All environment variable reference tables
- Features guide — generation, cover images, export, WordPress
- API reference — all endpoints with method/auth/description
- Admin dashboard guide
- Stripe and WordPress configuration
- Vercel deployment guide
- Testing and CI/CD setup
- GDPR and legal compliance
- Troubleshooting

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

---

## Support

For installation help or bug reports, please use the support channel on the marketplace where you purchased this item. Include your Node.js version (`node -v`), browser, and a description of the issue.

---

## License

This item is sold under the marketplace license terms (Regular or Extended License). You may not redistribute or resell the source code. See the included `LICENSE` file for details.
