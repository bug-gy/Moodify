const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema(
  {
    externalApiId: { type: String, required: true, unique: true },
    apiSource: { type: String, default: 'spotify' },
    title: { type: String, required: true, index: true },
    artist: { type: String, required: true },
    album: { type: String },
    artworkUrl: { type: String },
    streamUrl: { type: String },
    durationMs: { type: Number, default: 0 },
    acousticAttributes: {
      bpm: { type: Number },
      energy: { type: Number, min: 0, max: 1 },
      valence: { type: Number, min: 0, max: 1 },
      instrumentalness: { type: Number, min: 0, max: 1 },
      acousticness: { type: Number, min: 0, max: 1 },
    },
    moodTags: [{ type: String, index: true, lowercase: true }],
    cachedAt: { type: Date, default: Date.now, expires: 604800 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Track', TrackSchema);
