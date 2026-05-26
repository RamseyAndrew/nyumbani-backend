const express = require('express');
const verifyToken = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { v2: cloudinary } = require('cloudinary');
const crypto = require('crypto');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET signed upload signature
router.get('/sign', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { firebaseId: req.user.uid } });
    if (!user || (user.role !== 'AGENT' && user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Only agents can upload property images' });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const params = {
      timestamp,
      folder: 'nyumbani/properties',
    };

    // Generate signature
    const paramsStr = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    const signature = crypto
      .createHash('sha1')
      .update(paramsStr + process.env.CLOUDINARY_API_SECRET)
      .digest('hex');

    res.json({
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder: 'nyumbani/properties',
    });
  } catch (e) {
    console.error('Sign error:', e.message);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
});

// POST process uploaded URLs (stores them in database if needed)
router.post('/confirm', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { firebaseId: req.user.uid } });
    if (!user || (user.role !== 'AGENT' && user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Only agents can upload images' });
    }

    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'No URLs provided' });
    }

    // Validate URLs are from Cloudinary
    const validUrls = urls.filter((url) => url?.includes('cloudinary.com'));
    if (validUrls.length === 0) {
      return res.status(400).json({ error: 'Invalid image URLs' });
    }

    res.json({ urls: validUrls, count: validUrls.length });
  } catch (e) {
    console.error('Confirm error:', e.message);
    res.status(500).json({ error: e.message || 'Upload confirmation failed' });
  }
});

module.exports = router;
