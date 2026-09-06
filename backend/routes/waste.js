const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const WasteRecord = require('../models/WasteRecord');
const rateLimit = require('express-rate-limit');

const wasteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: 'Too many requests created from this IP, please try again after a minute'
});

// @route   GET api/waste
// @desc    Get all waste records (with optional type filtering)
// @access  Private (or Public if you want ESP32 without auth to send to the same, but let's keep it Private for reading)
router.get('/', auth, async (req, res) => {
  try {
    const { wasteType } = req.query;
    let query = {};
    
    if (wasteType && wasteType !== 'All') {
      query.wasteType = wasteType;
    }
    
    const records = await WasteRecord.find(query).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/waste/analytics
// @desc    Get waste analytics data
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const analytics = await WasteRecord.aggregate([
      {
        $group: {
          _id: "$wasteType",
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json(analytics);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/waste
// @desc    Add new waste record (ESP32 will hit this)
// @access  Public (so ESP32 doesn't need complex auth, or you can add a simple API key)
router.post('/', wasteLimiter, async (req, res) => {
  const { locality, houseNumber, wasteType } = req.body;

  try {
    const newRecord = new WasteRecord({
      locality,
      houseNumber,
      wasteType
    });

    const record = await newRecord.save();

    // Broadcast real-time waste record update to all connected Socket.IO clients
    const io = req.app.get('io');
    if (io) {
      io.emit('new_waste_record', record);
    }

    res.json(record);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
