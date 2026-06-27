import logger from '../utils/logger.js';
import Article from '../models/Article.js';
import User from '../models/User.js';
import Image from '../models/Image.js';
import ImageService from '../services/ImageService.js';
import { getOpenAIClientAndModel } from '../services/openaiService.js';

// @desc    Generate an AI cover image for an article using DALL-E 3
// @route   POST /api/articles/:id/generate-cover-ai
// @access  Private
export const generateAICover = async (req, res) => {
  try {
    const { id } = req.params;
    const { customPrompt } = req.body;

    const article = await Article.findOne({ _id: id, user: req.user.id });
    if (!article) {
      return res.status(404).json({ error: 'Article not found or access denied.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let openai;
    try {
      ({ openai } = await getOpenAIClientAndModel(user));
    } catch (configError) {
      return res.status(400).json({ error: configError.message });
    }

    const prompt = customPrompt?.trim() ||
      `A professional, high-quality editorial cover image for a blog article. ` +
      `Title: "${article.title}". Topic: "${article.keyword}". ` +
      `Style: clean modern photography or flat illustration, suitable for a tech/marketing blog. ` +
      `No text, no watermarks, no people's faces.`;

    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
      response_format: 'url',
    });

    const imageUrl = imageResponse.data?.[0]?.url;
    if (!imageUrl) {
      return res.status(500).json({ error: 'Image generation returned no URL. Please try again.' });
    }

    // Download the image from OpenAI's temporary URL
    const fetchResponse = await fetch(imageUrl);
    if (!fetchResponse.ok) {
      return res.status(500).json({ error: 'Failed to retrieve the generated image.' });
    }
    const imageBuffer = Buffer.from(await fetchResponse.arrayBuffer());

    // Delete previous cover image from S3 + DB if it exists
    if (article.coverImageId) {
      const oldImage = await Image.findById(article.coverImageId);
      if (oldImage) {
        await ImageService.deleteImagePaths(
          [oldImage.path, oldImage.thumbnails?.small, oldImage.thumbnails?.medium, oldImage.thumbnails?.large]
            .filter(Boolean)
        );
        await oldImage.deleteOne();
      }
    }

    // Reuse existing ImageService pipeline: resize, convert to WebP, upload to S3
    const mockFile = { buffer: imageBuffer, mimetype: 'image/png' };
    const uploadResult = await ImageService.uploadImage(mockFile, 'ai-covers');

    const imageDoc = await Image.create({
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

    res.status(200).json({ success: true, coverImageId: imageDoc._id, coverUrl });

  } catch (error) {
    logger.error('AI COVER GENERATION ERROR:', error);

    if (error?.status === 404) {
      return res.status(400).json({ error: 'Your current AI provider does not support image generation (DALL-E 3). Please use a direct OpenAI API key to generate AI covers.' });
    }
    if (error?.status === 400) {
      return res.status(400).json({ error: 'Image request was rejected. Try rephrasing your article title or keyword.' });
    }
    if (error?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key. DALL-E 3 requires a valid OpenAI key.' });
    }
    if (error?.status === 429) {
      return res.status(429).json({ error: 'OpenAI rate limit reached. Please wait a moment and try again.' });
    }

    res.status(500).json({ error: 'Failed to generate AI cover image.' });
  }
};
