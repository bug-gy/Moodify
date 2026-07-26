const generateToken = require('../utils/generateToken');

const authSuccess = (req, res) => {
  const token = generateToken(req.user);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.redirect(`${process.env.CLIENT_URL}/dashboard`);
};

const authLogout = (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

const getMe = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { authSuccess, authLogout, getMe };
