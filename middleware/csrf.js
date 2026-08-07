const { doubleCsrf } = require('csrf-csrf');

const { generateCsrfToken: generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'nyumbani-csrf-secret-change-in-prod',
  getSessionIdentifier: (req) => req.ip,
  cookieName: 'psifi.x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
  size: 64,
  getTokenFromRequest: (req) =>
    req.headers['x-csrf-token'] || req.body?._csrf,
});

module.exports = { generateToken, doubleCsrfProtection };
