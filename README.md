# 🤖 Premium AI SEO Article Generator

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-green.svg)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-cyan.svg)](https://tailwindcss.com/)

A modern, production-ready, and beautifully styled web application that empowers users to generate high-performing, SEO-optimized articles from target keywords using advanced Large Language Model algorithms (OpenAI / OpenRouter). Designed with a premium Glassmorphic UI and robust, decoupled Express/Mongoose architecture, this script is fully prepared for commercial packaging and marketplace validation (such as CodeCanyon).

---

## ✨ Features

- **🧠 Auto-Generated SEO Content**: Instantly produces catchy article titles, engaging meta descriptions, and highly structured, semantic Markdown articles.
- **🏷️ Smart LSI & Long-Tail Keyword Suggestions**: Automatically yields 5 to 10 highly indexed SEO keyword alternatives to capture extra organic search intent.
- **📄 One-Click Export**: Integrated clipboard tool that copies formatted markdown, titles, descriptions, and keyword metrics instantly.
- **🎨 Premium Visual Experience**: Features modern glassmorphism design tokens, smooth interactive animations, responsive flexboxes, and Google Fonts.
- **🛡️ Secure & Scalable Architecture**: Armed with request rate limiters, secure HTTP headers, JWT authentication guards, and decoupled database and cloud-storage configuration modules.

---

## 📦 Package Directory Layout

```text
ai-seo-generator-root/
├── backend/                  # Node.js/Express API Engine
│   ├── config/               # Centralized configuration modules (Mongoose DB, S3 Storage)
│   ├── controllers/          # Logical endpoints (Articles, Authentication, Settings)
│   ├── middleware/           # Protect security guard, multer file uploads, rate limiters
│   ├── models/               # Schemas (User, Article, Image, Settings)
│   ├── routes/               # Express endpoints routers
│   ├── services/             # Third-party integrations (S3 Client, OpenAI Client)
│   ├── .env.example          # Commented environment configurations model
│   ├── package.json          # Server package specifications
│   └── server.js             # Main engine execution entry
├── frontend/                 # React Single Page Application (Vite + Tailwind v4)
│   ├── src/                  # Components, Hooks, API libraries, and Pages
│   ├── .env.example          # Client-side gateway URL model
│   └── package.json          # Client bundle configurations
├── documentation/            # Marketplace Interactive Guides
│   └── index.html            # Stunning interactive setup guide with clipboards
├── install.sh                # Diagnostic one-click bash auto-installer script
├── package.json              # Orchestrates concurrent multi-package development
└── README.md                 # Product landing presentation page (this file)
```

---

## 🚀 Speed Run Installation

### 1. One-Click Automatic Install (Recommended)

Simply execute our premium auto-installation script in the root directory. It runs system diagnostics, copies configuration templates, and downloads all dependencies for you:

```bash
bash install.sh
```

### 2. Configure Environment Variables

Open `backend/.env` and update the necessary keys:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/seo-article-generator
JWT_SECRET=generate_your_secure_secret_key_here
OPENAI_API_KEY=your_secret_openai_api_key
OPENAI_MODEL=gpt-4o
```

### 3. Start the Complete Application

Launch the entire suite concurrently (Frontend client and Backend server) with one simple script:

```bash
npm run dev
```

- **Frontend Client**: Accessible at [http://localhost:5173](http://localhost:5173)
- **Backend API Gateway**: Live at [http://localhost:5000/api](http://localhost:5000/api)

---

## 📖 Interactive Documentation

We have packed an outstanding, responsive **HTML Documentation Portal** inside this package! Learn about manual installations, database deployment checklists, API endpoints, production builds, and demo video guidelines by opening **[documentation/index.html](documentation/index.html)** in any web browser.

---

## 📄 License

This product is ready for standard and extended distribution licensing. Be sure to customize environment secrets and branding details before publishing.
