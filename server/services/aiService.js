const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a music mood analysis AI. Given a user's text description of their mood or situation, analyze it and return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "tags": ["tag1", "tag2"],
  "attributes": { "energy": 0.0-1.0, "valence": 0.0-1.0, "bpm": 60-180 },
  "searchQuery": "short music search query"
}

Rules:
- tags: 2-5 lowercase mood/activity/vibe tags (e.g., "chill", "study", "rain", "focus", "night", "cozy", "sad", "happy", "sleep", "energetic", "romantic", "nostalgic", "jazzy")
- attributes.energy: 0.0 (calm) to 1.0 (intense)
- attributes.valence: 0.0 (sad/negative) to 1.0 (happy/positive)
- attributes.bpm: appropriate beats per minute
- searchQuery: a concise 2-4 word search query for finding matching music (e.g., "lo fi chill beats", "rainy jazzhop", "calm piano study")`;

const parseMood = async (text) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: `Analyze this mood: "${text}"` },
  ]);

  const response = result.response;
  const raw = response.text().trim();

  const cleaned = raw.replace(/```json?/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
};

module.exports = { parseMood };
