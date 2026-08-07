require('dotenv').config();
const { validateEnv } = require('./lib/env');
validateEnv();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { generateToken, doubleCsrfProtection } = require('./middleware/csrf');

const propertiesRouter = require('./routes/properties');
const inquiriesRouter = require('./routes/inquiries');
const favoritesRouter = require('./routes/favorites');
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
const uploadsRouter = require('./routes/uploads');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000' 
];

if (process.env.CORS_ORIGIN) {
  const productionOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
  allowedOrigins.push(...productionOrigins);
}

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true 
}));
app.use(cookieParser());
app.use(express.json());

// CSRF protection for all state-changing routes
app.use(doubleCsrfProtection);

// Endpoint for the frontend to fetch a CSRF token
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: generateToken(req, res) });
});

// Rate limiting on auth endpoints apparently ni very important to avoid traffic
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to user auth endpoints
app.use('/api/users/register', authLimiter);
app.use('/api/users/login', authLimiter);

app.use('/api/properties', propertiesRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/uploads', uploadsRouter);

app.get ('/', (_, res) => res.send('Welcome to the Nyumbani API!'));
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Nyumbani server running on port ${PORT}`));
