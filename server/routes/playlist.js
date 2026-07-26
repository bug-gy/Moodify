const express = require('express');
const {
  getPlaylists,
  createPlaylist,
  getPlaylistById,
  deletePlaylist,
  removeTrack,
} = require('../controllers/playlistController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getPlaylists);
router.post('/', authenticate, createPlaylist);
router.get('/:id', authenticate, getPlaylistById);
router.delete('/:id', authenticate, deletePlaylist);
router.put('/:id/track', authenticate, removeTrack);

module.exports = router;
