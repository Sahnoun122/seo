import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

const AI_MODEL = process.env.OPENAI_MODEL || 'openrouter/free';

export const generateInternalLinkingSuggestions = async (content, knownUrls = []) => {
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

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: "You are a helpful AI SEO assistant. You must always respond in valid JSON format." },
      { role: "user", content: prompt }
    ],
  });

  let rawContent = completion.choices[0].message.content;
  
  // Robust JSON extraction
  const start = rawContent.indexOf('{');
  const end = rawContent.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    rawContent = rawContent.substring(start, end + 1);
  }
  
  return JSON.parse(rawContent);
};
