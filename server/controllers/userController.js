const Track = require('../models/Track');
const Playlist = require('../models/Playlist');
const { getStreamUrl } = require('../services/musicApi');

const saveTrackToPlaylist = async (req, res) => {
  try {
    const { externalApiId, title, artist, album, artworkUrl, durationMs, apiSource } = req.body;

    if (!externalApiId || !title) {
      return res.status(400).json({ error: 'externalApiId and title are required' });
    }

    let track = await Track.findOne({ externalApiId, apiSource: apiSource || 'youtube_music' });
    if (!track) {
      track = await Track.create({
        externalApiId,
        apiSource: apiSource || 'youtube_music',
        title,
        artist: artist || 'Unknown Artist',
        album: album || null,
        artworkUrl: artworkUrl || null,
        streamUrl: null,
        durationMs: durationMs || 0,
      });
    }

    let playlist = await Playlist.findOne({
      userId: req.user.id,
      title: 'Liked Songs',
    });

    if (!playlist) {
      playlist = await Playlist.create({
        userId: req.user.id,
        title: 'Liked Songs',
        description: 'Songs you liked',
        tracks: [],
      });
    }

    if (!playlist.tracks.includes(track._id)) {
      playlist.tracks.push(track._id);
      await playlist.save();
    }

    const populated = await playlist.populate('tracks');

    res.json({ saved: true, track: track, playlist: populated });
  } catch (error) {
    console.error('Error in saveTrackToPlaylist:', error.message);
    res.status(500).json({ error: 'Failed to save track' });
  }
};

const removeTrackFromPlaylist = async (req, res) => {
  try {
    const { externalApiId, apiSource } = req.body;
    if (!externalApiId) return res.status(400).json({ error: 'externalApiId is required' });

    const playlist = await Playlist.findOne({
      userId: req.user.id,
      title: 'Liked Songs',
    });
    if (!playlist) return res.json({ removed: false });

    const track = await Track.findOne({ externalApiId, apiSource: apiSource || 'youtube_music' });
    if (!track) return res.json({ removed: false });

    playlist.tracks = playlist.tracks.filter((t) => t.toString() !== track._id.toString());
    await playlist.save();

    res.json({ removed: true });
  } catch (error) {
    console.error('Error in removeTrackFromPlaylist:', error.message);
    res.status(500).json({ error: 'Failed to remove track' });
  }
};

const getStreamForTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const track = await Track.findById(id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    if (track.streamUrl) {
      return res.json({ streamUrl: track.streamUrl });
    }

    const url = await getStreamUrl(track.externalApiId);
    if (url) {
      track.streamUrl = url;
      await track.save();
    }

    res.json({ streamUrl: url });
  } catch (error) {
    console.error('Error in getStreamForTrack:', error.message);
    res.status(500).json({ error: 'Failed to get stream URL' });
  }
};

const checkTrackSaved = async (req, res) => {
  try {
    const { externalApiId } = req.params;
    const playlist = await Playlist.findOne({
      userId: req.user.id,
      title: 'Liked Songs',
    }).populate('tracks');
    if (!playlist) return res.json({ saved: false });

    const saved = playlist.tracks.some((t) => t.externalApiId === externalApiId);
    res.json({ saved });
  } catch (error) {
    console.error('Error in checkTrackSaved:', error.message);
    res.status(500).json({ error: 'Failed to check track' });
  }
};

module.exports = { saveTrackToPlaylist, removeTrackFromPlaylist, checkTrackSaved, getStreamForTrack };
