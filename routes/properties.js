const express = require('express');
const verifyToken = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET all properties with filters
router.get('/', async (req, res) => {
  const { type, listingType, subcounty, county, minPrice, maxPrice, bedrooms } = req.query;
  try {
    const properties = await prisma.property.findMany({
      where: {
        ...(type && { type }),
        ...(listingType && { listingType }),
        ...(subcounty && { subcounty: { contains: subcounty, mode: 'insensitive' } }),
        ...(county && { county: { contains: county, mode: 'insensitive' } }),
        ...(bedrooms && { bedrooms: parseInt(bedrooms) }),
        ...(minPrice || maxPrice ? {
          price: {
            ...(minPrice && { gte: parseFloat(minPrice) }),
            ...(maxPrice && { lte: parseFloat(maxPrice) }),
          }
        } : {}),
        available: true,
      },
      include: { agent: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(properties);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET single property
router.get('/:id', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: { agent: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!property) return res.status(404).json({ error: 'Not found' });
    res.json(property);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST create property (agent/admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const agent = await prisma.user.findUnique({ where: { firebaseId: req.user.uid } });
    if (!agent) return res.status(401).json({ error: 'Only agents can create properties' });
    if (agent.role !== 'AGENT')
      return res.status(403).json({ error: 'Forbidden' });

    // Validate input
    const { price, bedrooms, bathrooms, lat, lng } = req.body;
    if (typeof price !== 'number' || price <= 0)
      return res.status(400).json({ error: 'Price must be positive' });
    if (bedrooms !== null && (typeof bedrooms !== 'number' || bedrooms < 0))
      return res.status(400).json({ error: 'Bedrooms cannot be negative' });
    if (bathrooms !== null && (typeof bathrooms !== 'number' || bathrooms < 0))
      return res.status(400).json({ error: 'Bathrooms cannot be negative' });
    if (typeof lat !== 'number' || typeof lng !== 'number')
      return res.status(400).json({ error: 'Invalid coordinates' });
    if (lat < -5 || lat > 5 || lng < 33.9 || lng > 42)
      return res.status(400).json({ error: 'Coordinates must be in Kenya' });

    const property = await prisma.property.create({
      data: { ...req.body, agentId: agent.id },
    });
    res.status(201).json(property);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT update property
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const agent = await prisma.user.findUnique({ where: { firebaseId: req.user.uid } });
    if (!agent) return res.status(401).json({ error: 'Only agents can update properties' });
    const property = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!property) return res.status(404).json({ error: 'Not found' });
    if (property.agentId !== agent.id && agent.role !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.property.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE property
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const agent = await prisma.user.findUnique({ where: { firebaseId: req.user.uid } });
    if (!agent) return res.status(401).json({ error: 'User not found' });
    const property = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!property) return res.status(404).json({ error: 'Not found' });
    if (property.agentId !== agent.id && agent.role !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });

    await prisma.property.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
