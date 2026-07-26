const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token =
    req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const optionalAuth = (req, _res, next) => {
  const token =
    req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
};

module.exports = { authenticate, optionalAuth };
