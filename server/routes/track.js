const express = require('express');
const { saveTrackToPlaylist, removeTrackFromPlaylist, checkTrackSaved, getStreamForTrack } = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/save', authenticate, saveTrackToPlaylist);
router.post('/unsave', authenticate, removeTrackFromPlaylist);
router.get('/check-saved/:externalApiId', authenticate, checkTrackSaved);
router.get('/:id/stream', optionalAuth, getStreamForTrack);

module.exports = router;
