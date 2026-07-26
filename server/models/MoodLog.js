const mongoose = require('mongoose');

const MoodLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    inputType: { type: String, enum: ['gui_click', 'text_description'], required: true },
    rawInput: { type: String, required: true },
    parsedTags: [{ type: String }],
    recommendedTracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
    userFeedbackScore: { type: Number, min: -1, max: 1, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MoodLog', MoodLogSchema);
