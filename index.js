require('dotenv').config();
const { validateEnv } = require('./lib/env');
validateEnv();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const propertiesRouter = require('./routes/properties');
const inquiriesRouter = require('./routes/inquiries');
const favoritesRouter = require('./routes/favorites');
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
const uploadsRouter = require('./routes/uploads');

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

// Rate limiting on auth endpoints
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

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Nyumbani server running on port ${PORT}`));
