const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    oauthProvider: { type: String, required: true, enum: ['google'] },
    oauthId: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatarUrl: { type: String },
    preferences: {
      defaultAmbientSound: { type: String, default: 'none' },
      preferredBpmRange: {
        min: { type: Number, default: 60 },
        max: { type: Number, default: 90 },
      },
    },
    likedTracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
    dislikedTracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
    listeningHistory: [
      {
        track: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
        playedAt: { type: Date, default: Date.now },
        contextMood: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
