const { parseMood } = require('../services/aiService');
const { searchTracks, getStreamUrl } = require('../services/musicApi');
const MoodLog = require('../models/MoodLog');

const guiMoodMap = {
  chill: 'lo fi chill beats',
  happy: 'happy lo fi upbeat',
  sad: 'sad melancholic lo fi',
  focused: 'lo fi study focus',
  sleepy: 'sleepy calm lo fi',
  energetic: 'energetic upbeat lo fi',
  romantic: 'romantic lo fi love',
  nostalgic: 'nostalgic lo fi retro',
  rainy: 'rainy lo fi jazzhop',
  cozy: 'cozy warm lo fi',
  anxious: 'calming lo fi anxiety relief',
  angry: 'calm down lo fi',
};

const recommendByGui = async (req, res) => {
  try {
    const { mood } = req.params;
    const normalizedMood = mood.toLowerCase().trim();
    const searchQuery = guiMoodMap[normalizedMood] || `lo fi ${normalizedMood}`;

    const tracks = await searchTracks(searchQuery);

    const tracksWithStreams = await Promise.all(
      tracks.slice(0, 15).map(async (t) => {
        try {
          const url = await getStreamUrl(t.externalApiId);
          return { ...t, streamUrl: url };
        } catch {
          return t;
        }
      })
    );

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

    const tracks = await searchTracks(query);

    const tracksWithStreams = await Promise.all(
      tracks.slice(0, 20).map(async (t) => {
        try {
          const url = await getStreamUrl(t.externalApiId);
          return { ...t, streamUrl: url };
        } catch {
          return t;
        }
      })
    );

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
      count: tracksWithStreams.length,
      tracks: tracksWithStreams,
    });
  } catch (error) {
    console.error('Error in recommendByText:', error.message);
    res.status(502).json({ error: 'Failed to get recommendations' });
  }
};

module.exports = { recommendByGui, recommendByText };
