import Article from '../models/Article.js';
import User from '../models/User.js';
import Image from '../models/Image.js';
import ImageService from '../services/ImageService.js';
import { marked } from 'marked';
import { cleanAndParseJSON, handleOpenAIError, getOpenAIClientAndModel, chatCompletionWithFallback, streamCompletionWithFallback } from '../services/openaiService.js';
import logger from '../utils/logger.js';

marked.setOptions({ gfm: true, breaks: true });

// @desc    Generate an SEO article and keyword suggestions for a given keyword
// @route   POST /api/articles
// @access  Private
export const generateArticle = async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    if (keyword.length > 100) {
      return res.status(400).json({ error: 'Keyword must be 100 characters or less' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Authenticated user not found' });
    }

    // DEMO_MODE: return a pre-generated article without any external API call
    if (process.env.DEMO_MODE === 'true') {
      const demoContent = [
        `# The Complete Guide to ${keyword} in 2025`,
        '',
        '## Introduction',
        '',
        `In today's competitive digital landscape, understanding **${keyword}** is more important than ever. This guide covers everything you need to succeed.`,
        '',
        `## Why ${keyword} Matters`,
        '',
        `Millions of searches happen daily around **${keyword}**. Businesses and creators who master this topic gain a significant competitive edge over their rivals.`,
        '',
        '## Key Strategies for Success',
        '',
        '### 1. Research and Planning',
        '',
        `Before diving into **${keyword}**, invest time in thorough research. Understand your audience's pain points and search intent.`,
        '',
        '### 2. High-Quality Content Creation',
        '',
        'Focus on E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness). Create content that genuinely helps your readers solve their problems.',
        '',
        '### 3. Technical Optimization',
        '',
        'Ensure proper heading structure (H1 → H2 → H3), optimal keyword density, fast page load, and mobile-first design.',
        '',
        '### 4. Measure and Iterate',
        '',
        'Track rankings, organic traffic, and conversions. Use real data to refine your approach continuously.',
        '',
        '## Best Practices',
        '',
        `- **Keyword placement**: Use **${keyword}** naturally in the title, intro, and throughout`,
        '- **User intent**: Match content format to what searchers actually want',
        '- **Internal linking**: Connect related pages to build topical authority',
        '- **Multimedia**: Images and videos boost engagement and dwell time',
        '',
        '## Common Mistakes to Avoid',
        '',
        '1. Keyword stuffing — always prioritise readability over density',
        '2. Ignoring search intent — understand the "why" behind every query',
        '3. Skipping meta descriptions — they directly impact click-through rates',
        '4. Neglecting mobile — over 60 % of searches happen on mobile devices',
        '',
        '## Conclusion',
        '',
        `Mastering **${keyword}** requires consistent effort and a data-driven approach. Apply these strategies today and track your progress — SEO is a marathon, but results compound over time.`,
      ].join('\n');

      const demoArticle = new Article({
        user: user._id,
        keyword,
        title: `The Complete Guide to ${keyword} in 2025`,
        metaDescription: `Discover everything about ${keyword}. Expert tips, strategies, and best practices to help you achieve top rankings in 2025.`,
        content: demoContent,
        suggestedKeywords: [
          `best ${keyword} strategies`,
          `how to improve ${keyword}`,
          `${keyword} tips for beginners`,
          `${keyword} best practices 2025`,
          `${keyword} complete guide`,
          `${keyword} tools and resources`,
          `${keyword} for small business`,
          `${keyword} ROI`,
        ],
      });

      await demoArticle.save();
      return res.status(200).json({ success: true, data: demoArticle, demo: true });
    }

    let openai, model, isUserKey, language, tone;
    try {
      ({ openai, model, isUserKey, language, tone } = await getOpenAIClientAndModel(user));
    } catch (configError) {
      return res.status(400).json({ error: configError.message });
    }

    if (!isUserKey && user.credits <= 0) {
      return res.status(403).json({
        error: 'You have run out of credits. Please configure your own API key in Settings to continue, or contact support.'
      });
    }

    // Generate SEO article content
    const articlePrompt = `
      You are an expert SEO copywriter. Write a highly optimized, engaging, and comprehensive SEO article for the keyword: "${keyword}".
      The article should include:
      - A catchy, SEO-friendly title.
      - A compelling meta description (under 160 characters).
      - Well-structured content with H1, H2, and H3 headings.
      - An introduction, main body paragraphs, and a conclusion.
      - Formatted using standard Markdown.
      - Written in Language: ${language}
      - Written in Tone: ${tone}

      Respond in JSON format with the following keys:
      "title", "metaDescription", "content"
    `;

    let rawArticleText;
    let modelUsed = model;
    try {
      const { completion: articleCompletion, modelUsed: resolvedModel } = await chatCompletionWithFallback(openai, model, {
        max_tokens: 3000,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI SEO assistant. You must always respond in valid JSON format. Do not wrap the JSON output in markdown code blocks (e.g., do not use ```json ... ```)."
          },
          { role: "user", content: articlePrompt }
        ],
      }, { timeoutMs: 60000 });
      modelUsed = resolvedModel;
      const message = articleCompletion.choices[0].message;
      if (message.refusal) {
        throw new Error("AI refused the request: " + message.refusal);
      }
      rawArticleText = message.content;
      if (!rawArticleText) {
        throw new Error("The AI returned an empty response. Please try again.");
      }
    } catch (openaiErr) {
      if (openaiErr.message && (openaiErr.message.includes("refused") || openaiErr.message.includes("empty response"))) {
        throw openaiErr;
      }
      handleOpenAIError(openaiErr);
    }

    const articleData = cleanAndParseJSON(rawArticleText);

    // Generate keyword suggestions. This is a bonus feature on top of the article —
    // if it fails (rate limit, refusal, malformed JSON), the already-generated title
    // and content must still be saved rather than discarding the user's article.
    const keywordPrompt = `
      You are an expert SEO strategist. Suggest 5 to 10 highly relevant, long-tail, and LSI keywords related to: "${keyword}".

      Respond in JSON format with the following key:
      "keywords" (an array of strings)
    `;

    let suggestedKeywords = [];
    try {
      const { completion: keywordCompletion } = await chatCompletionWithFallback(openai, modelUsed, {
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI SEO assistant. You must always respond in valid JSON format. Do not wrap the JSON output in markdown code blocks."
          },
          { role: "user", content: keywordPrompt }
        ],
      }, { timeoutMs: 25000 });
      const message = keywordCompletion.choices[0].message;
      if (message.refusal) {
        throw new Error("AI refused the keyword request: " + message.refusal);
      }
      if (!message.content) {
        throw new Error("The AI returned an empty response for keywords.");
      }
      const keywordData = cleanAndParseJSON(message.content);
      suggestedKeywords = keywordData.keywords || [];
    } catch (keywordErr) {
      logger.warn('Keyword suggestion step failed — saving article without them:', keywordErr.message);
    }

    const newArticle = new Article({
      user: user._id,
      keyword: keyword,
      title: articleData.title,
      metaDescription: articleData.metaDescription,
      content: articleData.content,
      suggestedKeywords
    });

    await newArticle.save();

    if (!isUserKey) {
      user.credits = Math.max(0, user.credits - 1);
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: newArticle
    });

  } catch (error) {
    logger.error('Generation Error:', error.message);
    res.status(500).json({ error: 'Failed to generate article.' });
  }
};

// @desc    Fetch article generation history for the authenticated user
// @route   GET /api/history?page=1&limit=12&search=keyword
// @access  Private
export const getHistory = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const search = (req.query.search || '').trim();

    const filter = { user: req.user.id };
    if (search) {
      filter.$or = [
        { title:   { $regex: search, $options: 'i' } },
        { keyword: { $regex: search, $options: 'i' } },
      ];
    }

    const [total, articles] = await Promise.all([
      Article.countDocuments(filter),
      Article.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-versions'),
    ]);

    res.status(200).json({
      success: true,
      data: articles,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    logger.error('Error fetching history:', error.message);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
};

// @desc    Refine a previously generated article based on an editorial prompt
// @route   PUT /api/articles/:id/refine
// @access  Private
export const refineArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt } = req.body;

    const article = await Article.findOne({ _id: id, user: req.user.id });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Authenticated user not found' });
    }

    let openai, model, language, tone;
    try {
      ({ openai, model, language, tone } = await getOpenAIClientAndModel(user));
    } catch (configError) {
      return res.status(400).json({ error: configError.message });
    }

    const refinementPrompt = `
      You are an expert SEO editor. The user wants to modify the following SEO article.

      CURRENT ARTICLE:
      Title: ${article.title}
      Content: ${article.content}

      USER REQUEST: "${prompt}"

      Please update the article (Title, Meta Description, and Content) based on the user request.
      Maintain high SEO standards and standard Markdown formatting.
      - Written in Language: ${language}
      - Written in Tone: ${tone}

      Respond in JSON format with the following keys:
      "title", "metaDescription", "content"
    `;

    let rawRefineText;
    try {
      const completion = await openai.chat.completions.create({
        model: model,
        max_tokens: 3000,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI SEO assistant. You must always respond in valid JSON format. Do not wrap the JSON output in markdown code blocks."
          },
          { role: "user", content: refinementPrompt }
        ],
      });
      const message = completion.choices[0].message;
      if (message.refusal) {
        throw new Error("AI refused the edit request: " + message.refusal);
      }
      rawRefineText = message.content;
      if (!rawRefineText) {
        throw new Error("The AI returned an empty response for the edit. Please try again.");
      }
    } catch (openaiErr) {
      if (openaiErr.message && (openaiErr.message.includes("refused") || openaiErr.message.includes("empty response"))) {
        throw openaiErr;
      }
      handleOpenAIError(openaiErr);
    }

    const updatedData = cleanAndParseJSON(rawRefineText);

    // Save current state as a version before overwriting (max 10 versions)
    article.versions = [
      { title: article.title, metaDescription: article.metaDescription, content: article.content, refinedAt: new Date() },
      ...article.versions,
    ].slice(0, 10);

    article.title = updatedData.title || article.title;
    article.metaDescription = updatedData.metaDescription || article.metaDescription;
    article.content = updatedData.content || article.content;

    await article.save();

    res.status(200).json({
      success: true,
      data: article
    });

  } catch (error) {
    logger.error('Refinement Error:', error.message);
    res.status(500).json({ error: 'Failed to refine article.' });
  }
};

// @desc    Regenerate SEO keyword suggestions for an existing article. Keyword
// suggestions are a bonus step during generation, so if it fails at that point
// (rate limit, malformed response) the article is saved with an empty list rather
// than being discarded — this endpoint lets the user retry just that small step.
// @route   POST /api/articles/:id/regenerate-keywords
// @access  Private
export const regenerateKeywords = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findOne({ _id: id, user: req.user.id });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Authenticated user not found' });
    }

    let openai, model;
    try {
      ({ openai, model } = await getOpenAIClientAndModel(user));
    } catch (configError) {
      return res.status(400).json({ error: configError.message });
    }

    try {
      const { completion } = await chatCompletionWithFallback(openai, model, {
        max_tokens: 500,
        messages: [
          { role: 'system', content: 'You are an SEO strategist. Respond only in valid JSON. No markdown fences.' },
          { role: 'user', content: `Suggest 5 to 10 highly relevant long-tail and LSI keywords for: "${article.keyword}". Respond with JSON key "keywords" (array of strings).` },
        ],
      }, { timeoutMs: 25000 });
      const keywordData = cleanAndParseJSON(completion.choices[0].message.content);
      article.suggestedKeywords = keywordData.keywords || [];
    } catch (keywordErr) {
      handleOpenAIError(keywordErr);
    }

    await article.save();

    res.status(200).json({ success: true, data: article });
  } catch (error) {
    logger.error('Regenerate Keywords Error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to regenerate keywords.' });
  }
};

// @desc    Publish an SEO article directly to the user's WordPress site as a draft
// @route   POST /api/articles/:id/publish-wordpress
// @access  Private
export const publishToWordPress = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Decrypt credentials via Mongoose getters
    const userSettings = user.toObject({ getters: true }).settings || {};
    const { wpUrl, wpUsername, wpApplicationPassword } = userSettings;
    if (!wpUrl?.trim() || !wpUsername?.trim() || !wpApplicationPassword?.trim()) {
      return res.status(400).json({
        error: 'WordPress integration is not fully configured. Please provide the URL, username, and application password in your Settings.',
      });
    }

    const article = await Article.findOne({ _id: id, user: req.user.id });
    if (!article) {
      return res.status(404).json({ error: 'Article not found or access denied.' });
    }

    const articleHtml = marked.parse(article.content);

    // Initialize WordPress service
    const { default: WordPressService } = await import('../services/wordpressService.js');
    const wp = new WordPressService({
      siteUrl: wpUrl,
      username: wpUsername,
      appPassword: wpApplicationPassword,
    });

    // ── Step 1: Upload cover image as Featured Media ──────────────────────
    let featuredMediaId = null;
    if (article.coverImageId) {
      try {
        const coverImage = await Image.findById(article.coverImageId);
        if (coverImage?.path) {
          const { buffer, contentType } = await ImageService.getImageBuffer(coverImage.path);
          featuredMediaId = await wp.uploadMedia(
            buffer,
            coverImage.filename || 'cover.webp',
            contentType,
            article.title, // alt text for SEO
          );
          logger.info(`[WP] Featured image uploaded: media ID ${featuredMediaId}`);
        }
      } catch (imgErr) {
        // Non-blocking — publish the article even if image upload fails
        logger.warn(`[WP] Cover image upload failed (continuing without): ${imgErr.message}`);
      }
    }

    // ── Step 2: Create tags from suggested keywords ──────────────────────
    let tagIds = [];
    if (article.suggestedKeywords?.length > 0) {
      try {
        tagIds = await wp.ensureTags(article.suggestedKeywords);
        logger.info(`[WP] Tags created/found: ${tagIds.length} tag(s)`);
      } catch (tagErr) {
        logger.warn(`[WP] Tag creation failed (continuing without): ${tagErr.message}`);
      }
    }

    // ── Step 3: Create the post with SEO enrichment ─────────────────────
    const result = await wp.createPost({
      title: article.title,
      htmlContent: articleHtml,
      metaDescription: article.metaDescription,
      focusKeyword: article.keyword,
      tagIds,
      featuredMediaId,
    });

    res.status(200).json({
      success: true,
      message: 'Article successfully published to WordPress as a draft!',
      url: result.postUrl,
      editUrl: result.editUrl,
      featuredImage: !!featuredMediaId,
      tagsCount: tagIds.length,
    });

  } catch (error) {
    logger.error('WordPress Publish Error:', error.message);
    const status = error.status || 500;
    res.status(status).json({
      error: error.message || 'An unexpected error occurred while publishing to WordPress.',
    });
  }
};

// @desc    Delete an article by ID (owner only)
// @route   DELETE /api/articles/:id
// @access  Private
export const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findOne({ _id: req.params.id, user: req.user.id });
    if (!article) {
      return res.status(404).json({ error: 'Article not found or access denied.' });
    }

    if (article.coverImageId) {
      const image = await Image.findById(article.coverImageId);
      if (image) {
        await ImageService.deleteImagePaths(
          [image.path, image.thumbnails?.small, image.thumbnails?.medium, image.thumbnails?.large].filter(Boolean)
        );
        await image.deleteOne();
      }
    }

    await article.deleteOne();
    res.status(200).json({ success: true, message: 'Article deleted.' });
  } catch (error) {
    logger.error('Delete Article Error:', error.message);
    res.status(500).json({ error: 'Failed to delete article.' });
  }
};

// @desc    Restore a previous version of an article
// @route   POST /api/articles/:id/restore/:versionIndex
// @access  Private
export const restoreVersion = async (req, res) => {
  try {
    const { id, versionIndex } = req.params;
    const idx = parseInt(versionIndex, 10);

    const article = await Article.findOne({ _id: id, user: req.user.id });
    if (!article) {
      return res.status(404).json({ error: 'Article not found or access denied.' });
    }

    if (isNaN(idx) || idx < 0 || idx >= article.versions.length) {
      return res.status(400).json({ error: 'Invalid version index.' });
    }

    const version = article.versions[idx];

    // Save current state as a new version before restoring
    article.versions = [
      { title: article.title, metaDescription: article.metaDescription, content: article.content, refinedAt: new Date() },
      ...article.versions,
    ].slice(0, 10);

    article.title           = version.title;
    article.metaDescription = version.metaDescription;
    article.content         = version.content;

    await article.save();

    res.status(200).json({ success: true, data: article });
  } catch (error) {
    logger.error('Restore Version Error:', error.message);
    res.status(500).json({ error: 'Failed to restore version.' });
  }
};

// @desc    Upload and set cover image for an article
// @route   POST /api/articles/:id/cover
// @access  Private
export const setCoverImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const article = await Article.findOne({ _id: id, user: req.user.id });
    if (!article) {
      return res.status(404).json({ error: 'Article not found or access denied.' });
    }

    // Delete old cover image from S3 if exists
    if (article.coverImageId) {
      const oldImage = await Image.findById(article.coverImageId);
      if (oldImage) {
        await ImageService.deleteImagePaths([
          oldImage.path,
          oldImage.thumbnails?.small,
          oldImage.thumbnails?.medium,
          oldImage.thumbnails?.large,
        ].filter(Boolean));
        await oldImage.deleteOne();
      }
    }

    const uploadResult = await ImageService.uploadImage(req.file, 'articles');

    const imageDoc = await Image.create({
      user: req.user.id,
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

    const coverUrl = `/api/images/${imageDoc._id}/view?size=medium`;

    res.status(200).json({
      success: true,
      coverImageId: imageDoc._id,
      coverUrl,
    });
  } catch (error) {
    logger.error('Set Cover Image Error:', error.message);
    res.status(500).json({ error: 'Failed to upload cover image.' });
  }
};

// @desc    Generate a streaming SEO article via Server-Sent Events
// @route   POST /api/articles/stream
// @access  Private
export const streamArticle = async (req, res) => {
  const { keyword } = req.body;

  if (!keyword || keyword.trim() === '') {
    return res.status(400).json({ error: 'Keyword is required' });
  }
  if (keyword.length > 100) {
    return res.status(400).json({ error: 'Keyword must be 100 characters or less' });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let openai, model, isUserKey, language, tone;
  try {
    ({ openai, model, isUserKey, language, tone } = await getOpenAIClientAndModel(user));
  } catch (configError) {
    return res.status(400).json({ error: configError.message });
  }

  if (!isUserKey && user.credits <= 0) {
    return res.status(403).json({ error: 'You have run out of credits. Please configure your own API key in Settings or contact support.' });
  }

  // DEMO_MODE: stream a pre-built article without any external API call
  if (process.env.DEMO_MODE === 'true') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

    const demoTitle = `The Complete Guide to ${keyword} in 2025`;
    const demaMeta = `Discover everything about ${keyword}. Expert tips, strategies, and best practices to help you achieve top rankings in 2025.`;
    const demoLines = [
      `# The Complete Guide to ${keyword} in 2025`, '',
      '## Introduction', '',
      `In today's competitive digital landscape, understanding **${keyword}** is more important than ever. This guide covers everything you need to succeed.`, '',
      `## Why ${keyword} Matters`, '',
      `Millions of searches happen daily around **${keyword}**. Businesses and creators who master this topic gain a significant competitive edge over their rivals.`, '',
      '## Key Strategies for Success', '',
      '### 1. Research and Planning', '',
      `Before diving into **${keyword}**, invest time in thorough research. Understand your audience's pain points and search intent.`, '',
      '### 2. High-Quality Content Creation', '',
      'Focus on E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness). Create content that genuinely helps your readers solve their problems.', '',
      '### 3. Technical Optimization', '',
      'Ensure proper heading structure (H1 → H2 → H3), optimal keyword density, fast page load, and mobile-first design.', '',
      '### 4. Measure and Iterate', '',
      'Track rankings, organic traffic, and conversions. Use real data to refine your approach continuously.', '',
      '## Best Practices', '',
      `- **Keyword placement**: Use **${keyword}** naturally in the title, intro, and throughout`,
      '- **User intent**: Match content format to what searchers actually want',
      '- **Internal linking**: Connect related pages to build topical authority',
      '- **Multimedia**: Images and videos boost engagement and dwell time', '',
      '## Common Mistakes to Avoid', '',
      '1. Keyword stuffing — always prioritise readability over density',
      '2. Ignoring search intent — understand the "why" behind every query',
      '3. Skipping meta descriptions — they directly impact click-through rates',
      '4. Neglecting mobile — over 60 % of searches happen on mobile devices', '',
      '## Conclusion', '',
      `Mastering **${keyword}** requires consistent effort and a data-driven approach. Apply these strategies today and track your progress — SEO is a marathon, but results compound over time.`,
    ];
    const demoContent = demoLines.join('\n');

    send({ type: 'status', step: 'meta' });
    send({ type: 'meta', title: demoTitle, metaDescription: demaMeta });
    send({ type: 'status', step: 'content' });
    for (const line of demoLines) {
      send({ type: 'delta', delta: line + '\n' });
    }
    send({ type: 'status', step: 'keywords' });
    send({ type: 'status', step: 'saving' });
    const demoArticle = await Article.create({
      user: user._id,
      keyword,
      title: demoTitle,
      metaDescription: demaMeta,
      content: demoContent,
      suggestedKeywords: [
        `best ${keyword} strategies`, `how to improve ${keyword}`,
        `${keyword} tips for beginners`, `${keyword} best practices 2025`,
        `${keyword} complete guide`, `${keyword} tools and resources`,
        `${keyword} for small business`, `${keyword} ROI`,
      ],
    });
    send({ type: 'done', data: demoArticle });
    res.end();
    return;
  }

  // Switch to SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    // Step 1: Get title + meta (fast, non-streaming)
    send({ type: 'status', step: 'meta' });
    const { completion: metaCompletion, modelUsed } = await chatCompletionWithFallback(openai, model, {
      max_tokens: 300,
      messages: [
        { role: 'system', content: 'You are an SEO expert. Respond only in valid JSON. No markdown fences.' },
        { role: 'user', content: `Generate a catchy SEO title and a meta description (under 160 chars) for the keyword: "${keyword}". Language: ${language}. Tone: ${tone}. Respond with JSON keys "title" and "metaDescription".` },
      ],
    }, { timeoutMs: 25000 });
    const metaData = cleanAndParseJSON(metaCompletion.choices[0].message.content);
    send({ type: 'meta', title: metaData.title, metaDescription: metaData.metaDescription });

    // Step 2: Stream the article content. Reuse whichever model answered the meta step —
    // it just proved itself available, no need to re-probe the fallback chain from scratch.
    send({ type: 'status', step: 'content' });
    const { fullContent, modelUsed: contentModelUsed } = await streamCompletionWithFallback(openai, modelUsed, {
      max_tokens: 3000,
      messages: [
        { role: 'system', content: 'You are an expert SEO copywriter. Write well-structured Markdown articles.' },
        { role: 'user', content: `Write a comprehensive, SEO-optimized article body for the title: "${metaData.title}" and keyword: "${keyword}". Use H2/H3 headings, bullet lists, and a strong introduction and conclusion. Language: ${language}. Tone: ${tone}. Output only Markdown — no JSON, no code fences.` },
      ],
    }, {
      timeoutMs: 30000,
      onDelta: (delta) => send({ type: 'delta', delta }),
    });

    // Step 3: Get keyword suggestions (fast, non-streaming). This is a bonus feature —
    // if it fails (rate limit, malformed JSON), the already-streamed title and content
    // must still be saved rather than discarding the user's article.
    send({ type: 'status', step: 'keywords' });
    let suggestedKeywords = [];
    try {
      const { completion: keywordCompletion } = await chatCompletionWithFallback(openai, contentModelUsed, {
        max_tokens: 500,
        messages: [
          { role: 'system', content: 'You are an SEO strategist. Respond only in valid JSON. No markdown fences.' },
          { role: 'user', content: `Suggest 5 to 10 highly relevant long-tail and LSI keywords for: "${keyword}". Respond with JSON key "keywords" (array of strings).` },
        ],
      }, { timeoutMs: 25000 });
      const keywordData = cleanAndParseJSON(keywordCompletion.choices[0].message.content);
      suggestedKeywords = keywordData.keywords || [];
    } catch (keywordErr) {
      logger.warn('Keyword suggestion step failed — saving article without them:', keywordErr.message);
    }

    // Step 4: Save to DB
    send({ type: 'status', step: 'saving' });
    const article = await Article.create({
      user: user._id,
      keyword,
      title: metaData.title,
      metaDescription: metaData.metaDescription,
      content: fullContent,
      suggestedKeywords,
    });

    if (!isUserKey) {
      user.credits = Math.max(0, user.credits - 1);
      await user.save();
    }

    send({ type: 'done', data: article });
    res.end();
  } catch (error) {
    logger.error('Stream Article Error:', error.message);
    let userMessage = error.message || 'Generation failed.';
    try {
      handleOpenAIError(error);
    } catch (mappedError) {
      userMessage = mappedError.message;
    }
    try {
      send({ type: 'error', message: userMessage });
      res.end();
    } catch (_) {}
  }
};
