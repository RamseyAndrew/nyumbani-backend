const express = require('express');
const verifyToken = require('../middleware/auth');
const prisma = require('../lib/prisma');
// const adminEmail = process.env.ADMIN_EMAIL || '';
// const userRole = email === adminEmail ? 'ADMIN' : (role === 'AGENT' ? 'AGENT' : 'USER');

const router = express.Router();

// Sync Firebase user to DB on login/register
router.post('/sync', verifyToken, async (req, res) => {
  const { uid, email } = req.user;
  const { firstName, lastName, role, agencyName, phone, bio } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { firebaseId: uid } });
    if (existing) return res.json(existing);

    const userRole = email === process.env.ADMIN_EMAIL ? 'ADMIN' : (role === 'AGENT' ? 'AGENT' : 'USER');

    const status = role === 'AGENT' ? 'PENDING' : 'ACTIVE';
    const user = await prisma.user.create({
      data: {
        firebaseId: uid,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        role: userRole,
        status,
        ...(role === 'AGENT' && {
          agentProfile: {
            create: { agencyName, phone, bio: bio || '' },
          },
        }),
      },
      include: { agentProfile: true },
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: req.user.uid },
      include: { agentProfile: true, properties: true },
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET agent profile by userId (logged in users only)
router.get('/agent/:id', verifyToken, async (req, res) => {
  try {
    const agent = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        agentProfile: true,
        properties: { where: { available: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!agent || agent.role !== 'AGENT') return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
