const mongoose = require('mongoose');

const WasteRecordSchema = new mongoose.Schema({
  locality: {
    type: String,
    required: true
  },
  houseNumber: {
    type: String,
    required: true
  },
  wasteType: {
    type: String,
    enum: ['Wet', 'Dry', 'Metal'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WasteRecord', WasteRecordSchema);
