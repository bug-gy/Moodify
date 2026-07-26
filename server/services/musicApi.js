const { execFile } = require('child_process');
const path = require('path');

const PY_SCRIPT = path.join(__dirname, 'music_api.py');

const callPython = (args) => {
  return new Promise((resolve, reject) => {
    execFile('python3', [PY_SCRIPT, ...args], { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (parseError) {
        reject(new Error(`Failed to parse Python output: ${stdout.trim()}`));
      }
    });
  });
};

const searchTracks = async (query, limit = 15) => {
  const tracks = await callPython(['search', query]);
  return tracks.slice(0, limit);
};

const getStreamUrl = async (videoId) => {
  const result = await callPython(['stream', videoId]);
  return result.streamUrl || null;
};

const getAuthStatus = async () => {
  return callPython(['auth_status']);
};

module.exports = { searchTracks, getStreamUrl, getAuthStatus };
