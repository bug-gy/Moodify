const { parseMood } = require('../services/aiService');
const { searchTracks, getStreamUrl } = require('../services/musicApi');
const MoodLog = require('../models/MoodLog');

const guiMoodMap = {
  chill: 'chill relaxing mix',
  happy: 'upbeat happy pop',
  sad: 'melancholic sad songs',
  focused: 'study focus instrumental',
  sleepy: 'calm sleepy ambient',
  energetic: 'energetic workout music',
  romantic: 'romantic love songs',
  nostalgic: 'nostalgic throwback hits',
  rainy: 'rainy day acoustic',
  cozy: 'cozy warm indie',
  anxious: 'calming peaceful music',
  angry: 'angry intense rock',
};

const recommendByGui = async (req, res) => {
  try {
    const { mood } = req.params;
    const page = parseInt(req.query.page) || 0;
    const normalizedMood = mood.toLowerCase().trim();
    const searchQuery = guiMoodMap[normalizedMood] || `${normalizedMood} music`;

    const tracks = await searchTracks(searchQuery, 30);

    const pageSize = 15;
    const start = page * pageSize;
    const paginated = tracks.slice(start, start + pageSize);
    const hasMore = tracks.length > start + pageSize;

    const tracksWithStreams = paginated.map((t) => ({
      ...t,
      streamUrl: null,
    }));

    if (req.user) {
      await MoodLog.create({
        userId: req.user.id,
        inputType: 'gui_click',
        rawInput: normalizedMood,
        parsedTags: [normalizedMood],
      });
    }

    res.json({
      mood: normalizedMood,
      page,
      hasMore,
      count: tracksWithStreams.length,
      tracks: tracksWithStreams,
    });
  } catch (error) {
    console.error('Error in recommendByGui:', error.message);
    res.status(502).json({ error: 'Music API unavailable, try again later' });
  }
};

const recommendByText = async (req, res) => {
  try {
    const { prompt } = req.body;
    const page = parseInt(req.query.page) || 0;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    let parsed;
    try {
      parsed = await parseMood(prompt);
    } catch (aiError) {
      console.error('AI parsing failed:', aiError.message);
      return res.status(502).json({ error: 'AI service unavailable, please try again later' });
    }

    const { tags, searchQuery } = parsed;
    const query = searchQuery || tags.slice(0, 2).join(' ');

    const tracks = await searchTracks(query, 30);

    const pageSize = 15;
    const start = page * pageSize;
    const paginated = tracks.slice(start, start + pageSize);
    const hasMore = tracks.length > start + pageSize;

    const tracksWithStreams = paginated.map((t) => ({
      ...t,
      streamUrl: null,
    }));

    if (req.user) {
      await MoodLog.create({
        userId: req.user.id,
        inputType: 'text_description',
        rawInput: prompt,
        parsedTags: tags,
      });
    }

    res.json({
      parsed,
      page,
      hasMore,
      count: tracksWithStreams.length,
      tracks: tracksWithStreams,
    });
  } catch (error) {
    console.error('Error in recommendByText:', error.message);
    res.status(502).json({ error: 'Failed to get recommendations' });
  }
};

module.exports = { recommendByGui, recommendByText };
