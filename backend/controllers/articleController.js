import OpenAI from 'openai';
import Article from '../models/Article.js';
import User from '../models/User.js';
import { cleanAndParseJSON, handleOpenAIError } from '../services/openaiService.js';

// Les helpers de parsing et d'erreurs IA sont désormais centralisés et importés depuis openaiService.js

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

    let rawArticleText;
    try {
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
      rawArticleText = articleCompletion.choices[0].message.content;
    } catch (openaiErr) {
      handleOpenAIError(openaiErr);
    }

    const articleData = cleanAndParseJSON(rawArticleText);

    // 5. Generate Keyword Suggestions
    const keywordPrompt = `
      You are an expert SEO strategist. Suggest 5 to 10 highly relevant, long-tail, and LSI keywords related to: "${keyword}".
      
      Respond in JSON format with the following key:
      "keywords" (an array of strings)
    `;

    let rawKeywordText;
    try {
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
      rawKeywordText = keywordCompletion.choices[0].message.content;
    } catch (openaiErr) {
      handleOpenAIError(openaiErr);
    }

    const keywordData = cleanAndParseJSON(rawKeywordText);

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

    let rawRefineText;
    try {
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
      rawRefineText = completion.choices[0].message.content;
    } catch (openaiErr) {
      handleOpenAIError(openaiErr);
    }

    const updatedData = cleanAndParseJSON(rawRefineText);

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
 * Publie un article SEO directement sur le site WordPress de l'utilisateur sous forme de brouillon (draft).
 */
export const publishToWordPress = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Récupération des identifiants WordPress de l'utilisateur
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const { wpUrl, wpUsername, wpApplicationPassword } = user.settings || {};
    if (!wpUrl || !wpUrl.trim() || !wpUsername || !wpUsername.trim() || !wpApplicationPassword || !wpApplicationPassword.trim()) {
      return res.status(400).json({ 
        error: 'L\'intégration WordPress n\'est pas entièrement configurée. Veuillez renseigner l\'URL, l\'identifiant et le mot de passe d\'application dans vos Réglages.' 
      });
    }
    
    // 2. Récupération de l'article en vérifiant la propriété
    const article = await Article.findOne({ _id: id, user: req.user.id });
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé ou accès non autorisé.' });
    }
    
    // 3. Conversion du Markdown en HTML propre et sémantique
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
    
    // 4. Construction de l'URL de l'API REST de WordPress
    let baseUrl = wpUrl.trim();
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    baseUrl = baseUrl.replace(/\/+$/, '');
    const wpEndpoint = `${baseUrl}/wp-json/wp/v2/posts`;
    
    // 5. Encodage Base64 des identifiants (Basic Auth)
    const authString = Buffer.from(`${wpUsername}:${wpApplicationPassword}`).toString('base64');
    
    // 6. Requête sécurisée vers l'API REST de WordPress
    const response = await fetch(wpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        title: article.title,
        content: articleHtml,
        status: 'draft', // Enregistré sous forme de brouillon
        excerpt: article.metaDescription
      })
    });
    
    const wpData = await response.json();
    
    if (!response.ok) {
      console.error('Erreur retournée par WordPress :', wpData);
      return res.status(response.status).json({ 
        error: wpData.message || 'La publication vers WordPress a échoué. Veuillez vérifier vos réglages ou autorisations.' 
      });
    }
    
    // Retourne le lien de prévisualisation/édition du brouillon
    res.status(200).json({
      success: true,
      message: 'L\'article a été publié avec succès sur WordPress en tant que brouillon !',
      url: wpData.link
    });
    
  } catch (error) {
    console.error('ERREUR DE PUBLICATION WP :', error);
    res.status(500).json({ 
      error: 'Un problème technique inattendu est survenu lors de la publication vers WordPress.', 
      details: error.message 
    });
  }
};
