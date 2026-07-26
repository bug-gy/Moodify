const Playlist = require('../models/Playlist');
const Track = require('../models/Track');

const getPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.user.id })
      .populate('tracks')
      .sort({ updatedAt: -1 });
    res.json({ count: playlists.length, playlists });
  } catch (error) {
    console.error('Error in getPlaylists:', error.message);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
};

const createPlaylist = async (req, res) => {
  try {
    const { title, description, trackIds, isPublic } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }

    let tracks = [];
    if (trackIds && Array.isArray(trackIds)) {
      tracks = await Track.find({ _id: { $in: trackIds } });
    }

    const playlist = await Playlist.create({
      userId: req.user.id,
      title,
      description: description || '',
      tracks: tracks.map((t) => t._id),
      isPublic: isPublic || false,
    });

    const populated = await playlist.populate('tracks');

    res.status(201).json({ playlist: populated });
  } catch (error) {
    console.error('Error in createPlaylist:', error.message);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
};

const getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id).populate('tracks');

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this playlist' });
    }

    res.json({ playlist });
  } catch (error) {
    console.error('Error in getPlaylistById:', error.message);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
};

const deletePlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this playlist' });
    }

    await Playlist.findByIdAndDelete(req.params.id);

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Error in deletePlaylist:', error.message);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
};

const removeTrack = async (req, res) => {
  try {
    const { trackId } = req.body;
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    playlist.tracks = playlist.tracks.filter((t) => t.toString() !== trackId);
    await playlist.save();
    const populated = await playlist.populate('tracks');
    res.json({ playlist: populated });
  } catch (error) {
    console.error('Error in removeTrack:', error.message);
    res.status(500).json({ error: 'Failed to remove track' });
  }
};

module.exports = { getPlaylists, createPlaylist, getPlaylistById, deletePlaylist, removeTrack };
