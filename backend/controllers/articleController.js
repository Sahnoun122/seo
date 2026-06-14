import Article from '../models/Article.js';
import User from '../models/User.js';
import { cleanAndParseJSON, handleOpenAIError, getOpenAIClientAndModel } from '../services/openaiService.js';

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
    try {
      const articleCompletion = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI SEO assistant. You must always respond in valid JSON format. Do not wrap the JSON output in markdown code blocks (e.g., do not use ```json ... ```)."
          },
          { role: "user", content: articlePrompt }
        ],
      });
      const message = articleCompletion.choices[0].message;
      if (message.refusal) {
        throw new Error("AI refused the request: " + message.refusal);
      }
      rawArticleText = message.content;
      if (!rawArticleText) {
        console.error("OpenAI API returned empty content. Full response:", JSON.stringify(articleCompletion));
        throw new Error("The AI returned an empty response. Please try again.");
      }
    } catch (openaiErr) {
      if (openaiErr.message && (openaiErr.message.includes("refused") || openaiErr.message.includes("empty response"))) {
        throw openaiErr;
      }
      handleOpenAIError(openaiErr);
    }

    const articleData = cleanAndParseJSON(rawArticleText);

    // Generate keyword suggestions
    const keywordPrompt = `
      You are an expert SEO strategist. Suggest 5 to 10 highly relevant, long-tail, and LSI keywords related to: "${keyword}".

      Respond in JSON format with the following key:
      "keywords" (an array of strings)
    `;

    let rawKeywordText;
    try {
      const keywordCompletion = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI SEO assistant. You must always respond in valid JSON format. Do not wrap the JSON output in markdown code blocks."
          },
          { role: "user", content: keywordPrompt }
        ],
      });
      const message = keywordCompletion.choices[0].message;
      if (message.refusal) {
        throw new Error("AI refused the keyword request: " + message.refusal);
      }
      rawKeywordText = message.content;
      if (!rawKeywordText) {
        console.error("OpenAI API returned empty keyword content. Full response:", JSON.stringify(keywordCompletion));
        throw new Error("The AI returned an empty response for keywords. Please try again.");
      }
    } catch (openaiErr) {
      if (openaiErr.message && (openaiErr.message.includes("refused") || openaiErr.message.includes("empty response"))) {
        throw openaiErr;
      }
      handleOpenAIError(openaiErr);
    }

    const keywordData = cleanAndParseJSON(rawKeywordText);

    const newArticle = new Article({
      user: user._id,
      keyword: keyword,
      title: articleData.title,
      metaDescription: articleData.metaDescription,
      content: articleData.content,
      suggestedKeywords: keywordData.keywords || []
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
    console.error("GENERATION ERROR:", { message: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate article.' });
  }
};

// @desc    Fetch article generation history for the authenticated user
// @route   GET /api/articles
// @access  Private
export const getHistory = async (req, res) => {
  try {
    const articles = await Article.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.status(200).json({
      success: true,
      data: articles
    });
  } catch (error) {
    console.error("Error fetching history:", error);
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
        console.error("OpenAI API returned empty refinement content. Full response:", JSON.stringify(completion));
        throw new Error("The AI returned an empty response for the edit. Please try again.");
      }
    } catch (openaiErr) {
      if (openaiErr.message && (openaiErr.message.includes("refused") || openaiErr.message.includes("empty response"))) {
        throw openaiErr;
      }
      handleOpenAIError(openaiErr);
    }

    const updatedData = cleanAndParseJSON(rawRefineText);

    article.title = updatedData.title || article.title;
    article.metaDescription = updatedData.metaDescription || article.metaDescription;
    article.content = updatedData.content || article.content;

    await article.save();

    res.status(200).json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error("REFINEMENT ERROR:", { message: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to refine article.' });
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

    const { wpUrl, wpUsername, wpApplicationPassword } = user.settings || {};
    if (!wpUrl?.trim() || !wpUsername?.trim() || !wpApplicationPassword?.trim()) {
      return res.status(400).json({
        error: 'WordPress integration is not fully configured. Please provide the URL, username, and application password in your Settings.'
      });
    }

    const article = await Article.findOne({ _id: id, user: req.user.id });
    if (!article) {
      return res.status(404).json({ error: 'Article not found or access denied.' });
    }

    const convertMarkdownToHTML = (markdown) => {
      let html = markdown;
      html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
      html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
      html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

      const lines = html.split('\n');
      let inList = false;
      const processedLines = lines.map(line => {
        const listMatch = line.match(/^[-*+]\s+(.*?)$/);
        if (listMatch) {
          let result = '';
          if (!inList) { result += '<ul>\n'; inList = true; }
          result += `  <li>${listMatch[1]}</li>`;
          return result;
        } else {
          let result = '';
          if (inList) { result += '</ul>\n'; inList = false; }
          result += line;
          return result;
        }
      });
      if (inList) processedLines.push('</ul>');
      html = processedLines.join('\n');

      const blocks = html.split('\n\n');
      const formattedBlocks = blocks.map(block => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('</ul')) {
          return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
      });

      return formattedBlocks.filter(b => b.length > 0).join('\n\n');
    };

    const articleHtml = convertMarkdownToHTML(article.content);

    let baseUrl = wpUrl.trim();
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    baseUrl = baseUrl.replace(/\/+$/, '');
    const wpEndpoint = `${baseUrl}/wp-json/wp/v2/posts`;

    const authString = Buffer.from(`${wpUsername}:${wpApplicationPassword}`).toString('base64');

    const response = await fetch(wpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        title: article.title,
        content: articleHtml,
        status: 'draft',
        excerpt: article.metaDescription
      })
    });

    const wpData = await response.json();

    if (!response.ok) {
      console.error('WordPress API error:', wpData);
      return res.status(response.status).json({
        error: wpData.message || 'Publishing to WordPress failed. Please check your settings and permissions.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Article successfully published to WordPress as a draft!',
      url: wpData.link
    });

  } catch (error) {
    console.error('WORDPRESS PUBLISH ERROR:', error);
    res.status(500).json({ error: 'An unexpected error occurred while publishing to WordPress.' });
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
    await article.deleteOne();
    res.status(200).json({ success: true, message: 'Article deleted.' });
  } catch (error) {
    console.error('DELETE ARTICLE ERROR:', error);
    res.status(500).json({ error: 'Failed to delete article.' });
  }
};
