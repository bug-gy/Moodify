const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, default: 'My Lo-Fi Vibe' },
    description: { type: String },
    generatedByAi: { type: Boolean, default: false },
    originalPrompt: { type: String },
    tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
    isPublic: { type: Boolean, default: false },
    coverImage: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Playlist', PlaylistSchema);
