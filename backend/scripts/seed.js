/**
 * ============================================================
 *  DEV ONLY — DO NOT RUN IN PRODUCTION
 *  Seeds the database with demo admin, users, and sample articles.
 *  Run with: node backend/scripts/seed.js
 * ============================================================
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Article from '../models/Article.js';
import connectDB from '../config/db.js';
import { isProduction } from '../utils/env.js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

if (isProduction()) {
  console.error('ERROR: Seed script must not be run in production.');
  process.exit(1);
}

const sampleArticles = [
  {
    keyword: 'best ai tools for seo 2025',
    title: '15 Best AI Tools for SEO in 2025 (Tested & Ranked)',
    metaDescription: 'Discover the top 15 AI SEO tools of 2025. We tested each tool for content quality, keyword optimization, and ROI. Here are the clear winners.',
    content: `## Introduction

Artificial intelligence has fundamentally changed how SEO professionals approach content creation, keyword research, and on-page optimization. In 2025, the market is flooded with AI SEO tools — but only a handful truly deliver results.

We spent 3 months testing over 40 AI SEO tools and ranked the top 15 based on output quality, ease of use, integrations, and value for money.

## 1. SEO Gen AI

The standout performer in our tests. SEO Gen AI combines multi-model AI (GPT-4o, DeepSeek, Groq) with a built-in WordPress publisher and Unsplash image picker. The real-time SSE streaming means you see your article being written live — no waiting.

**Key features:**
- Multi-model AI engine (GPT-4o, DeepSeek, Groq, OpenRouter)
- 1-click WordPress publish with featured images
- Internal linking assistant
- 6 languages with RTL support

## 2. Surfer SEO

Surfer remains the industry standard for on-page optimization. Its Content Editor integrates with Google Docs and provides real-time NLP keyword suggestions.

## 3. Jasper AI

Jasper excels at long-form content with brand voice consistency. The templates library is extensive, though the output can feel formulaic compared to newer models.

## Conclusion

The AI SEO landscape in 2025 is more competitive than ever. For pure content generation speed and quality, SEO Gen AI leads the pack. For on-page audits and competitor analysis, Surfer SEO remains the benchmark.`,
    suggestedKeywords: ['ai seo tools', 'best seo software 2025', 'ai content generation', 'seo automation tools', 'gpt for seo'],
  },
  {
    keyword: 'how to rank on google in 2025',
    title: 'How to Rank on Google in 2025: The Complete Guide',
    metaDescription: 'Learn proven strategies to rank on Google in 2025. From E-E-A-T signals to AI-assisted content, this guide covers everything you need to dominate search.',
    content: `## Why Ranking on Google Is Harder (and Easier) Than Ever

Google processes over 8.5 billion searches per day. Ranking on the first page means your content needs to be genuinely better than the 9 other results — not just keyword-stuffed. The good news? Most of your competitors are still playing the old game.

## The E-E-A-T Framework in 2025

Google's Quality Rater Guidelines emphasize **Experience, Expertise, Authoritativeness, and Trustworthiness**. In 2025, this means:

- First-hand experience signals (personal case studies, original data)
- Author credentials and bylines
- Citations from authoritative external sources
- Fast, secure, mobile-optimized pages

## Keyword Strategy for 2025

Stop chasing high-volume keywords. The modern SEO strategy targets **intent clusters** — groups of related keywords that share the same user intent.

**Example cluster for "project management software":**
- best project management software (informational)
- project management software pricing (commercial)
- monday.com vs asana (comparative)
- how to set up project management workflow (how-to)

## Technical SEO Fundamentals

Core Web Vitals remain a ranking factor. Target:
- LCP < 2.5s
- FID/INP < 200ms
- CLS < 0.1

## Content Length and Structure

The sweet spot for comprehensive guides is **2,500–4,000 words**. Structure every article with:
1. A clear H1 targeting your primary keyword
2. H2 subheadings for major sections
3. H3 subheadings for subsections
4. A FAQ section targeting "People Also Ask" questions

## Conclusion

Ranking on Google in 2025 requires a combination of genuine expertise, technical excellence, and AI-assisted content at scale. The brands winning search are those treating SEO as a long-term business moat, not a short-term traffic hack.`,
    suggestedKeywords: ['google ranking factors 2025', 'seo strategy 2025', 'e-e-a-t seo', 'how to rank higher on google', 'seo tips 2025'],
  },
  {
    keyword: 'content marketing strategy for startups',
    title: 'Content Marketing Strategy for Startups: 0 to 100K Monthly Visitors',
    metaDescription: 'The exact content marketing playbook used by high-growth startups to reach 100K monthly organic visitors. Includes templates, timelines, and tool stack.',
    content: `## Why Startups Need Content Marketing (More Than Anyone)

Paid acquisition costs are rising. In 2025, the average CPC across industries is 34% higher than in 2022. For startups with limited runway, content marketing is the highest-ROI growth channel available.

The compounding nature of SEO content means an article written today can generate leads for years. Compare that to paid ads — the moment you stop spending, the traffic stops.

## Phase 1: Foundation (Months 1–3)

Before publishing a single article, get these fundamentals right:

### 1. ICP Definition
Define your Ideal Customer Profile with specificity: job title, company size, pain points, and the exact search queries they use when looking for your solution.

### 2. Keyword Universe
Build a keyword universe of 200–500 target keywords organized by:
- Topic cluster (pillar + spoke structure)
- Search intent (informational, commercial, transactional)
- Difficulty and potential traffic

### 3. Content Calendar
Plan 12 weeks of content in advance. Publish consistently — 2 articles per week is the minimum to see meaningful traction within 6 months.

## Phase 2: Execution (Months 4–9)

### Pillar Content First
Start with your pillar pages — comprehensive 3,000–5,000 word guides targeting broad, high-intent keywords. These become the cornerstone of your topic clusters.

### AI-Assisted Production
Use AI tools to scale content production without sacrificing quality. The key is treating AI as a first draft generator, then adding original research, case studies, and expert quotes.

### Internal Linking
Build internal links from the start. A well-linked site transfers authority efficiently and helps Google understand your content hierarchy.

## Conclusion

The startups winning at content marketing in 2025 are those who treat it as a product — with a dedicated team, clear OKRs, and systematic production processes. The 0 to 100K journey takes 12–18 months, but the compounding returns are worth every piece of content you publish.`,
    suggestedKeywords: ['content marketing for startups', 'startup seo strategy', 'organic traffic growth', 'content marketing roi', 'b2b content strategy'],
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    const users = [
      { name: 'Super Admin', email: 'admin@seo.com',    password: 'Admin1234!', role: 'admin', credits: 9999, isEmailVerified: true },
      { name: 'John Doe',    email: 'john@example.com', password: 'Demo1234!',  role: 'user',  credits: 10,   isEmailVerified: true },
      { name: 'Jane Smith',  email: 'jane@example.com', password: 'Demo1234!',  role: 'user',  credits: 5,    isEmailVerified: true },
      { name: 'Bob Test',    email: 'bob@example.com',  password: 'Demo1234!',  role: 'user',  credits: 0,    isEmailVerified: true },
    ];

    const createdUsers = {};

    for (const userData of users) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create(userData);
        console.log(`Created user: ${userData.email} (${userData.role})`);
      } else {
        user.name = userData.name;
        user.password = userData.password;
        user.role = userData.role;
        user.credits = userData.credits;
        user.isEmailVerified = userData.isEmailVerified;
        await user.save();
        console.log(`Updated user: ${userData.email} (${userData.role})`);
      }
      createdUsers[userData.email] = user;
    }

    const demoUser = createdUsers['john@example.com'];
    const existingArticles = await Article.countDocuments({ user: demoUser._id });

    if (existingArticles === 0) {
      for (const articleData of sampleArticles) {
        await Article.create({ ...articleData, user: demoUser._id });
        console.log(`Created article: "${articleData.title}"`);
      }
    } else {
      console.log(`Skipped articles (${existingArticles} already exist for john@example.com)`);
    }

    console.log('\nDatabase seeded successfully.');
    console.log('Demo credentials:');
    console.log('  Admin:  admin@seo.com    / Admin1234!');
    console.log('  User:   john@example.com / Demo1234!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
