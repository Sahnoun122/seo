import OpenAI from 'openai';
import Article from '../models/Article.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export const generateArticle = async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    if (keyword.length > 100) {
      return res.status(400).json({ error: 'Keyword must be 100 characters or less' });
    }

    // Generate Article Content
    const articlePrompt = `
      You are an expert SEO copywriter. Write a highly optimized, engaging, and comprehensive SEO article for the keyword: "${keyword}".
      The article should include:
      - A catchy, SEO-friendly title.
      - A compelling meta description (under 160 characters).
      - Well-structured content with H1, H2, and H3 headings.
      - An introduction, main body paragraphs, and a conclusion.
      - Formatted using standard Markdown.
      
      Respond in JSON format with the following keys:
      "title", "metaDescription", "content"
    `;

    const articleCompletion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are a helpful AI SEO assistant. You must always respond in valid JSON format." },
        { role: "user", content: articlePrompt }
      ],
    });

    let articleContent = articleCompletion.choices[0].message.content;
    // Clean up potential markdown code blocks
    articleContent = articleContent.replace(/```json\n?|```/g, '').trim();
    const articleData = JSON.parse(articleContent);

    // Generate Keyword Suggestions
    const keywordPrompt = `
      You are an expert SEO strategist. Suggest 5 to 10 highly relevant, long-tail, and LSI keywords related to: "${keyword}".
      
      Respond in JSON format with the following key:
      "keywords" (an array of strings)
    `;

    const keywordCompletion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are a helpful AI SEO assistant. You must always respond in valid JSON format." },
        { role: "user", content: keywordPrompt }
      ],
    });

    let keywordContent = keywordCompletion.choices[0].message.content;
    // Clean up potential markdown code blocks
    keywordContent = keywordContent.replace(/```json\n?|```/g, '').trim();
    const keywordData = JSON.parse(keywordContent);

    // Save to Database
    const newArticle = new Article({
      user: req.user.id,
      keyword: keyword,
      title: articleData.title,
      metaDescription: articleData.metaDescription,
      content: articleData.content,
      suggestedKeywords: keywordData.keywords || []
    });

    await newArticle.save();

    // Respond to Client
    res.status(200).json({
      success: true,
      data: newArticle
    });

  } catch (error) {
    console.error("DETAILED ERROR:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: 'Failed to generate article.', 
      details: error.message 
    });
  }
};

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
export const refineArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt } = req.body;

    const article = await Article.findOne({ _id: id, user: req.user.id });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const refinementPrompt = `
      You are an expert SEO editor. The user wants to modify the following SEO article.
      
      CURRENT ARTICLE:
      Title: ${article.title}
      Content: ${article.content}
      
      USER REQUEST: "${prompt}"
      
      Please update the article (Title, Meta Description, and Content) based on the user request.
      Maintain high SEO standards and standard Markdown formatting.
      
      Respond in JSON format with the following keys:
      "title", "metaDescription", "content"
    `;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are a helpful AI SEO assistant. You must always respond in valid JSON format." },
        { role: "user", content: refinementPrompt }
      ],
    });

    let rawContent = completion.choices[0].message.content;
    
    // Robust JSON extraction
    try {
      // Find the first { and last }
      const start = rawContent.indexOf('{');
      const end = rawContent.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        rawContent = rawContent.substring(start, end + 1);
      }
      
      const updatedData = JSON.parse(rawContent);

      article.title = updatedData.title || article.title;
      article.metaDescription = updatedData.metaDescription || article.metaDescription;
      article.content = updatedData.content || article.content;
      
      await article.save();

      res.status(200).json({
        success: true,
        data: article
      });
    } catch (parseError) {
      console.error("JSON Parse Error during refinement:", parseError, "Raw content:", rawContent);
      throw new Error("AI returned invalid JSON. Please try again with a simpler request.");
    }

  } catch (error) {
    console.error("DETAILED REFINEMENT ERROR:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    res.status(500).json({ 
      error: 'Failed to refine article.', 
      details: error.message 
    });
  }
};
