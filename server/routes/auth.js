const express = require('express');
const passport = require('passport');
const { authSuccess, authLogout, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), authSuccess);

router.post('/logout', authLogout);
router.get('/me', authenticate, getMe);

module.exports = router;
