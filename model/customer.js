const mongoose = require('mongoose');
const streamSchema = require('./stream'); // import the schema above

const customerSchema = new mongoose.Schema({
  customerNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  streams: [streamSchema], // embedded list of streams
}, { timestamps: true }); // adds createdAt & updatedAt

module.exports = mongoose.model('Customer', customerSchema);
