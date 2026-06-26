# SEO Gen AI — Setup & Configuration Guide

This guide covers everything you need to do after installing the project for the first time: creating the admin account, configuring AI and payment providers, and deploying to production.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Environment Variables](#3-environment-variables)
4. [First Launch & Admin Account](#4-first-launch--admin-account)
5. [Admin Panel — System Settings](#5-admin-panel--system-settings)
6. [Configuring OpenAI / AI Models](#6-configuring-openai--ai-models)
7. [Configuring Stripe (Payments)](#7-configuring-stripe-payments)
8. [Configuring Email (Resend)](#8-configuring-email-resend)
9. [Configuring AWS S3 (Image Storage)](#9-configuring-aws-s3-image-storage)
10. [Configuring WordPress Integration](#10-configuring-wordpress-integration)
11. [Seeding Demo Data](#11-seeding-demo-data)
12. [Deployment](#12-deployment)
13. [Frequently Asked Questions](#13-frequently-asked-questions)

---

## 1. Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 20.x |
| npm | 10.x |
| MongoDB | 6.x (local or Atlas) |

Optional (for full features):

- An [OpenAI](https://platform.openai.com) API key **or** a key for DeepSeek / Groq / OpenRouter
- A [Stripe](https://stripe.com) account (for payments)
- A [Resend](https://resend.com) account (for transactional emails)
- An [AWS S3](https://aws.amazon.com/s3/) bucket (for image uploads)
- A [Sentry](https://sentry.io) project DSN (for error tracking — optional)

---

## 2. Installation

```bash
# 1. Clone the repository
git clone <your-repo-url> seo-gen-ai
cd seo-gen-ai

# 2. Install backend dependencies
cd backend && npm install

# 3. Install frontend dependencies
cd ../frontend && npm install
```

---

## 3. Environment Variables

### Backend (`backend/.env`)

Copy the example file and fill in the values:

```bash
cp backend/.env.example backend/.env
```

Required variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/seo-gen-ai` |
| `JWT_SECRET` | Random secret for JWT signing (min 32 chars) | `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256 encryption | `openssl rand -hex 32` |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment | `production` |
| `APP_URL` | Frontend public URL (for email links) | `https://yourdomain.com` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `https://yourdomain.com` |

Optional variables (enable features):

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | System-level OpenAI key (users without a personal key use this) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard → Webhooks |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `EMAIL_FROM` | Sender address (must be verified in Resend) |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3 |
| `AWS_REGION` | S3 bucket region (e.g. `eu-west-1`) |
| `AWS_S3_BUCKET` | S3 bucket name |
| `SENTRY_DSN` | Sentry DSN for error tracking |

### Frontend (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://api.yourdomain.com/api` |
| `VITE_SENTRY_DSN` | Sentry DSN (optional) | |

---

## 4. First Launch & Admin Account

Start the backend in development mode:

```bash
cd backend && npm run dev
```

Start the frontend:

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173` in your browser.

**The first user to register automatically becomes the administrator.** Register immediately after starting the app to secure the admin account.

> **Important:** Use a strong password and a real email address for the admin account. This account has full access to all user data, credits, and system settings.

After registering, you will be redirected to the Dashboard. Navigate to **Admin → Admin Dashboard** from the sidebar.

---

## 5. Admin Panel — System Settings

Go to **Admin → Admin Dashboard → System Settings** tab.

### Settings available:

| Setting | Description |
|---------|-------------|
| **System OpenAI API Key** | The shared API key used when users don't have their own key. All credit-based generations use this key. |
| **Default AI Model** | Model used for all generations (e.g. `gpt-4o`, `deepseek-chat`, `llama-3.1-8b-instant`) |
| **Default Base URL** | Override the OpenAI endpoint (for DeepSeek, Groq, OpenRouter, etc.) |
| **Allow User API Keys** | Toggle whether users can add their own API keys for unlimited generation |
| **Default Credits for New Users** | Number of credits assigned automatically on registration (default: 10) |

---

## 6. Configuring OpenAI / AI Models

The platform supports any OpenAI-compatible API. Set the **System OpenAI API Key** in Admin Settings.

### Using DeepSeek:
```
Base URL: https://api.deepseek.com/v1
Model:    deepseek-chat
```

### Using Groq:
```
Base URL: https://api.groq.com/openai/v1
Model:    llama-3.1-8b-instant  (or mixtral-8x7b-32768)
```

### Using OpenRouter (access 100+ models):
```
Base URL: https://openrouter.ai/api/v1
Model:    openai/gpt-4o  (or any OpenRouter model ID)
```

### Using standard OpenAI:
```
Base URL: https://api.openai.com/v1  (default, can leave empty)
Model:    gpt-4o
```

Users can also configure their **own personal API key** in Settings → AI Configuration, which gives them unlimited generations without consuming platform credits.

---

## 7. Configuring Stripe (Payments)

### Step 1 — Create your Stripe account

Sign up at [stripe.com](https://stripe.com) and activate your account.

### Step 2 — Get your API keys

Go to **Stripe Dashboard → Developers → API keys**:
- Copy the **Secret key** (`sk_live_...`) → `STRIPE_SECRET_KEY` in `.env`
- Copy the **Publishable key** (`pk_live_...`) → `STRIPE_PUBLISHABLE_KEY` in `.env`

For testing, use the test mode keys (`sk_test_...` / `pk_test_...`).

### Step 3 — Configure credit packages

The credit packages are defined in `backend/controllers/stripeController.js` (lines 13–17). Edit to match your desired pricing:

```js
const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter', credits: 20,  amount: 900  }, // $9
  { id: 'growth',  name: 'Growth',  credits: 100, amount: 2900 }, // $29
  { id: 'pro',     name: 'Pro',     credits: 500, amount: 9900 }, // $99
];
```

`amount` is in **cents** (USD). Adjust credits and amounts to your business model.

### Step 4 — Configure subscription plans (optional)

For subscription-based plans, create products and prices in the Stripe Dashboard, then update the price IDs in `backend/controllers/stripeController.js`.

### Step 5 — Set up Stripe webhooks

1. Go to **Stripe Dashboard → Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://api.yourdomain.com/api/stripe/webhook`
3. Select events to listen to:
   - `payment_intent.succeeded`
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
4. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` in `.env`

### Step 6 — Test Stripe locally with the Stripe CLI

Stripe webhooks need a public URL to reach your server. In development, use the **Stripe CLI** to tunnel events to your local machine:

**1. Install the Stripe CLI:**
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Linux — download from https://github.com/stripe/stripe-cli/releases
```

**2. Log in to your Stripe account:**
```bash
stripe login
```

**3. Forward webhooks to your local backend:**
```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

The CLI prints a **webhook signing secret** (starting with `whsec_...`). Copy it into your `backend/.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

**4. Test a payment with a Stripe test card:**

| Card number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 9995` | Payment declined |
| `4000 0025 0000 3155` | Requires 3D Secure |

Use any future expiry date (e.g., `12/34`) and any 3-digit CVC.

> **Switch to live mode:** Replace `sk_test_...` and `pk_test_...` with `sk_live_...` and `pk_live_...` keys from the Stripe Dashboard, and configure a real webhook endpoint URL before going to production.

---

## 8. Configuring Email (Resend)

Transactional emails (password reset, email verification) are sent via [Resend](https://resend.com).

### Setup:
1. Create a free account at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Go to **API Keys** and create a new key
4. Set in `.env`:
   ```
   RESEND_API_KEY=re_...
   EMAIL_FROM=noreply@yourdomain.com
   ```

> **Without Resend configured:** The app still works — reset links and verification links are printed to the server console instead. This is fine for development.

---

## 9. Configuring AWS S3 (Image Storage)

Cover images uploaded via the image upload feature are stored in S3. If S3 is not configured, image uploads will be disabled but all other features work normally.

### Setup:
1. Create an S3 bucket in your AWS account
2. Set the bucket policy to allow your IAM user read/write access
3. Set in `.env`:
   ```
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=eu-west-1
   AWS_S3_BUCKET=your-bucket-name
   ```

### Recommended bucket policy:
Enable **Block Public Access** on the bucket — the app generates pre-signed URLs for private access.

---

## 10. Configuring WordPress Integration

Users can publish articles directly to any WordPress site via the REST API.

### Per-user setup (from Settings → WordPress Integration):

1. **Site URL** — your WordPress site (e.g. `https://yourblog.com`)
2. **Username** — your WordPress admin username
3. **Application Password** — generate from:
   `WordPress Dashboard → Users → Profile → Application Passwords`
   → Enter a name → Click "Add New Application Password"

Articles are published as **drafts** — review and publish manually from WordPress.

---

## 11. Seeding Demo Data

To populate the database with sample users and articles for demonstration:

```bash
cd backend && node scripts/seed.js
```

This creates:
- `admin@seo.com` / `Admin1234!` — Administrator account
- `john@example.com` / `Demo1234!` — Demo user with 3 full sample articles
- `jane@example.com` / `Demo1234!` — Regular user
- `bob@example.com` / `Demo1234!` — Regular user

> **Warning:** The seed script drops the existing database. Do not run in production with real user data.

---

## 12. Deployment

### Option A — Vercel (Recommended for quick start)

**Frontend:**
1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://api.yourdomain.com/api`

**Backend:**
1. Add a second Vercel project, root directory `backend`
2. The included `vercel.json` handles routing
3. Add all backend environment variables in Vercel dashboard

### Option B — Railway

1. Create a new Railway project
2. Add a MongoDB service
3. Deploy backend and frontend as separate services
4. Set environment variables in Railway dashboard

### Option C — VPS (Ubuntu/Debian)

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Build frontend
cd frontend && npm run build
# Serve with nginx pointing to frontend/dist

# Start backend
cd backend && npm start
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

### Option D — Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production checklist

- [ ] `NODE_ENV=production` set in backend `.env`
- [ ] `JWT_SECRET` is a random 32+ character string (not the example value)
- [ ] `ENCRYPTION_KEY` is a random 32-byte hex string
- [ ] Stripe keys are **live** keys (not test keys)
- [ ] Stripe webhook endpoint is configured and secret is set
- [ ] `APP_URL` matches your actual frontend domain
- [ ] `CORS_ORIGINS` contains only your frontend domain
- [ ] MongoDB is hosted with authentication enabled (Atlas or secured VPS)
- [ ] S3 bucket has **Block Public Access** enabled
- [ ] HTTPS is enabled on both frontend and backend domains

---

## 13. Frequently Asked Questions

**Q: Can I use this without a Stripe account?**
A: Yes. Users can still generate articles using their own personal API key (no credits needed). Stripe is only required for the credit purchase and subscription features.

**Q: Can I use a free AI model?**
A: Yes. OpenRouter provides access to several free models (e.g. `mistralai/mistral-7b-instruct:free`). Set the system base URL to `https://openrouter.ai/api/v1` and use a free model ID.

**Q: How do I change the credit package prices?**
A: Edit `CREDIT_PACKAGES` in `backend/controllers/stripeController.js` and redeploy. The amounts are in cents.

**Q: Can I white-label this product?**
A: Yes. Replace "SEO Gen AI" with your brand name in `frontend/src/App.jsx`, `backend/package.json`, email templates in `backend/services/emailService.js`, and the legal pages in `documentation/`.

**Q: How do I upgrade a user's plan manually?**
A: Go to **Admin → User Manager**, find the user, and use the credits editor. For plan changes, update the user's `plan` field directly in MongoDB.

**Q: The email verification link shows localhost in production.**
A: Set `APP_URL=https://yourdomain.com` in your backend `.env`. This value is used to build verification and password reset email links.

**Q: I see "Stripe is not configured" errors.**
A: Add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` to your backend `.env`, then restart the server.
