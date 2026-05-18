import { cleanAndParseJSON, handleOpenAIError } from './openaiService.js';

export const generateInternalLinkingSuggestions = async (content, knownUrls = [], { openai, model } = {}) => {
  const prompt = `
    You are an expert SEO strategist. Analyze the following article content and suggest strategic internal linking opportunities.
    
    ARTICLE CONTENT:
    ${content}
    
    ${knownUrls.length > 0 ? `EXISTING URLS TO LINK TO:\n${knownUrls.join('\n')}` : 'Suggest relevant URLs based on common blog structures if no specific URLs are provided.'}
    
    For each suggestion, provide:
    1. Anchor text (the exact phrase to link from the content)
    2. Suggested URL (from the provided list or a logical placeholder)
    3. Context (the sentence containing the anchor text)
    4. Relevance Score (1-100)
    
    Respond in JSON format with the following key:
    "suggestions" (an array of objects with keys: "anchorText", "suggestedUrl", "context", "relevanceScore")
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o',
      messages: [
        { role: "system", content: "You are a helpful AI SEO assistant. You must always respond in valid JSON format." },
        { role: "user", content: prompt }
      ],
    });

    let rawContent = completion.choices[0].message.content;
    return cleanAndParseJSON(rawContent);
  } catch (error) {
    handleOpenAIError(error);
  }
};
