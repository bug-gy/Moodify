const express = require('express');
const { recommendByGui, recommendByText } = require('../controllers/moodController');
const { optionalAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const recommendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later' },
});

router.get('/:mood', optionalAuth, recommendByGui);
router.post('/recommend', recommendLimiter, optionalAuth, recommendByText);

module.exports = router;
