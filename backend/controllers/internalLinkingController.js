import logger from '../utils/logger.js';
import { generateInternalLinkingSuggestions } from '../services/internalLinkingService.js';
import InternalLink from '../models/InternalLink.js';
import { getOpenAIClientAndModel } from '../services/openaiService.js';

export const getInternalLinks = async (req, res) => {
  try {
    const { content, knownUrls, articleId } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Article content is required' });
    }

    const { openai, model } = await getOpenAIClientAndModel(req.user);
    const data = await generateInternalLinkingSuggestions(content, knownUrls, { openai, model });

    // Save to database
    const newInternalLink = new InternalLink({
      user: req.user.id,
      articleId: articleId || null,
      content,
      suggestions: data.suggestions
    });

    await newInternalLink.save();

    res.status(200).json({
      success: true,
      data: newInternalLink
    });

  } catch (error) {
    logger.error("Internal linking error:", error);
    res.status(500).json({ 
      error: 'Failed to generate internal links.', 
      details: error.message 
    });
  }
};
