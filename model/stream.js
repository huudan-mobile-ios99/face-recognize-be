const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  streamName: {
    type: String,
    required: true,
  },
  streamId: {
    type: String,
    required: true,
    // unique: true,
  },
  streamStartTime: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: Boolean,
    default: true, // true = active, false = inactive
  },
  streamEndTime: {
    type: Date,
    default: null,
  },
  streamDuration: {
    type: Number,
    default: 0, // in seconds (or minutes, your choice)
  },
  streamMachine: {
    type: String,
    required: true,
  },
  streamUrl: {
    type: String,
    required: true,
  },
}, { timestamps: true }); // adds createdAt & updatedAt

module.exports = streamSchema;
