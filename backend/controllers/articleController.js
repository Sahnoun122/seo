import OpenAI from 'openai';
import Article from '../models/Article.js';
import User from '../models/User.js';

/**
 * Reusable helper to safely parse JSON responses from LLM providers.
 * Locates the first '{' and the last '}' to isolate and parse the JSON string,
 * avoiding any potential markdown surrounding formatting.
 * 
 * @param {string} text - The raw message content from LLM completion
 * @returns {Object} Parsed JSON object
 */
const parseJSONSafely = (text) => {
  if (!text) {
    throw new Error('AI returned an empty response.');
  }

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1 || end < start) {
    throw new Error('No valid JSON object structure found in response.');
  }

  const jsonString = text.substring(start, end + 1);
  return JSON.parse(jsonString);
};

/**
 * Generates an SEO article and keyword suggestions based on a target keyword.
 * Uses custom user API key & provider configurations if present, else defaults to global credentials.
 */
export const generateArticle = async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    if (keyword.length > 100) {
      return res.status(400).json({ error: 'Keyword must be 100 characters or less' });
    }

    // 1. Fetch currently authenticated user and check settings
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Authenticated user not found' });
    }

    let openai;
    let model;
    let isUserKey = false;
    const language = user.settings?.defaultLanguage || 'French';
    const tone = user.settings?.defaultTone || 'Professional';

    const userApiKey = user.settings?.userApiKey?.trim();
    const userBaseUrl = user.settings?.userBaseUrl?.trim();
    const preferredModel = user.settings?.preferredModel?.trim();

    // 2. Resolve client and model dynamically
    if (userApiKey && userApiKey !== '') {
      openai = new OpenAI({
        apiKey: userApiKey,
        baseURL: userBaseUrl || 'https://api.openai.com/v1',
      });
      model = preferredModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';
      isUserKey = true;
    } else {
      const globalKey = process.env.OPENAI_API_KEY;
      if (!globalKey || globalKey.trim() === '') {
        return res.status(400).json({
          error: 'API configuration error. OpenAI API Key is not configured by the administrator or the user.'
        });
      }

      openai = new OpenAI({
        apiKey: globalKey,
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      });
      model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      isUserKey = false;
    }

    // 3. If using the global API key, enforce standard credit limits
    if (!isUserKey) {
      if (user.credits <= 0) {
        return res.status(403).json({
          error: 'You have run out of credits. Please configure your own API key in Settings to continue, or contact support.'
        });
      }
    }

    // 4. Generate SEO Article Content
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

    const articleCompletion = await openai.chat.completions.create({
      model: model,
      response_format: { type: "json_object" },
      messages: [
        { 
          role: "system", 
          content: "You are a helpful AI SEO assistant. You must always respond in valid JSON format. Do not wrap the JSON output in markdown code blocks (e.g., do not use ```json ... ```)." 
        },
        { role: "user", content: articlePrompt }
      ],
    });

    const rawArticleText = articleCompletion.choices[0].message.content;
    const articleData = parseJSONSafely(rawArticleText);

    // 5. Generate Keyword Suggestions
    const keywordPrompt = `
      You are an expert SEO strategist. Suggest 5 to 10 highly relevant, long-tail, and LSI keywords related to: "${keyword}".
      
      Respond in JSON format with the following key:
      "keywords" (an array of strings)
    `;

    const keywordCompletion = await openai.chat.completions.create({
      model: model,
      response_format: { type: "json_object" },
      messages: [
        { 
          role: "system", 
          content: "You are a helpful AI SEO assistant. You must always respond in valid JSON format. Do not wrap the JSON output in markdown code blocks." 
        },
        { role: "user", content: keywordPrompt }
      ],
    });

    const rawKeywordText = keywordCompletion.choices[0].message.content;
    const keywordData = parseJSONSafely(rawKeywordText);

    // 6. Save new generation to Database
    const newArticle = new Article({
      user: user._id,
      keyword: keyword,
      title: articleData.title,
      metaDescription: articleData.metaDescription,
      content: articleData.content,
      suggestedKeywords: keywordData.keywords || []
    });

    await newArticle.save();

    // 7. Decrement user credits if using global key
    if (!isUserKey) {
      user.credits = Math.max(0, user.credits - 1);
      await user.save();
    }

    // 8. Respond to Client
    res.status(200).json({
      success: true,
      data: newArticle
    });

  } catch (error) {
    console.error("GENERATION ERROR DETAILS:", {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to generate article.', 
      details: error.message 
    });
  }
};

/**
 * Fetch generation history for currently logged in user.
 */
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

/**
 * Refines a generated article based on editorial prompts.
 * Uses user custom client if set, else global keys.
 */
export const refineArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt } = req.body;

    const article = await Article.findOne({ _id: id, user: req.user.id });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // 1. Fetch authenticated user to get settings
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Authenticated user not found' });
    }

    let openai;
    let model;
    const language = user.settings?.defaultLanguage || 'French';
    const tone = user.settings?.defaultTone || 'Professional';

    const userApiKey = user.settings?.userApiKey?.trim();
    const userBaseUrl = user.settings?.userBaseUrl?.trim();
    const preferredModel = user.settings?.preferredModel?.trim();

    // 2. Resolve client and model dynamically
    if (userApiKey && userApiKey !== '') {
      openai = new OpenAI({
        apiKey: userApiKey,
        baseURL: userBaseUrl || 'https://api.openai.com/v1',
      });
      model = preferredModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    } else {
      const globalKey = process.env.OPENAI_API_KEY;
      if (!globalKey || globalKey.trim() === '') {
        return res.status(400).json({
          error: 'API configuration error. OpenAI API Key is not configured by the administrator or the user.'
        });
      }

      openai = new OpenAI({
        apiKey: globalKey,
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      });
      model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    }

    // 3. Generate article refinement
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

    const completion = await openai.chat.completions.create({
      model: model,
      response_format: { type: "json_object" },
      messages: [
        { 
          role: "system", 
          content: "You are a helpful AI SEO assistant. You must always respond in valid JSON format. Do not wrap the JSON output in markdown code blocks." 
        },
        { role: "user", content: refinementPrompt }
      ],
    });

    const rawRefineText = completion.choices[0].message.content;
    const updatedData = parseJSONSafely(rawRefineText);

    // 4. Save updates and respond
    article.title = updatedData.title || article.title;
    article.metaDescription = updatedData.metaDescription || article.metaDescription;
    article.content = updatedData.content || article.content;
    
    await article.save();

    res.status(200).json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error("REFINEMENT ERROR DETAILS:", {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to refine article.', 
      details: error.message 
    });
  }
};

/**
 * Publishes an SEO article directly to the user's WordPress site via REST API.
 */
export const publishWordPress = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Fetch user credentials
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { wpUrl, wpUsername, wpApplicationPassword } = user.settings || {};
    if (!wpUrl || !wpUsername || !wpApplicationPassword) {
      return res.status(400).json({ 
        error: 'WordPress integration is not configured. Please fill in your WordPress credentials in Settings.' 
      });
    }
    
    // 2. Fetch the article
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // 3. Convert Markdown to simple HTML
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
          if (!inList) {
            result += '<ul>\n';
            inList = true;
          }
          result += `  <li>${listMatch[1]}</li>`;
          return result;
        } else {
          let result = '';
          if (inList) {
            result += '</ul>\n';
            inList = false;
          }
          result += line;
          return result;
        }
      });
      if (inList) {
        processedLines.push('</ul>');
      }
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
    
    // 4. Construct WordPress request endpoint
    let baseUrl = wpUrl.trim();
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    baseUrl = baseUrl.replace(/\/+$/, '');
    const wpEndpoint = `${baseUrl}/wp-json/wp/v2/posts`;
    
    // 5. Basic Authentication Base64
    const authString = Buffer.from(`${wpUsername}:${wpApplicationPassword}`).toString('base64');
    
    // 6. Query WordPress REST API
    const response = await fetch(wpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        title: article.title,
        content: articleHtml,
        status: 'publish',
        excerpt: article.metaDescription
      })
    });
    
    const wpData = await response.json();
    
    if (!response.ok) {
      console.error('WordPress Error Response:', wpData);
      return res.status(response.status).json({ 
        error: wpData.message || 'Failed to publish to WordPress. Please check credentials or permissions.' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Article successfully published to WordPress!',
      url: wpData.link
    });
    
  } catch (error) {
    console.error('WP PUBLISH ERROR:', error);
    res.status(500).json({ 
      error: 'An unexpected technical issue occurred during WordPress publishing.', 
      details: error.message 
    });
  }
};
