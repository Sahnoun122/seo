import { generateInternalLinkingSuggestions } from '../services/internalLinkingService.js';
import InternalLink from '../models/InternalLink.js';

export const getInternalLinks = async (req, res) => {
  try {
    const { content, knownUrls, articleId } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Article content is required' });
    }

    const data = await generateInternalLinkingSuggestions(content, knownUrls);

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
    console.error("Internal linking error:", error);
    res.status(500).json({ 
      error: 'Failed to generate internal links.', 
      details: error.message 
    });
  }
};
