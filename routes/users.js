const express = require('express');
const verifyToken = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();


router.post('/sync', verifyToken, async (req, res) => {
  const { uid, email } = req.user;
  const { firstName, lastName, role, agencyName, phone, bio } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { firebaseId: uid } });
    if (existing) return res.json(existing);

    const targetAdmin = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const userEmail = (email || '').trim().toLowerCase();
    
    let userRole = 'USER';
    if (userEmail === targetAdmin && targetAdmin !== '') {
      userRole = 'ADMIN';
    } else if (role === 'AGENT') {
      userRole = 'AGENT';
    }

    const status = userRole === 'AGENT' ? 'PENDING' : 'ACTIVE';
    const user = await prisma.user.create({
      data: {
        firebaseId: uid,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        role: userRole,
        status,
        ...(userRole === 'AGENT' && {
          agentProfile: {
            create: { 
              agencyName: agencyName || 'Independent Agent', 
              phone: phone || '',
              bio: bio || '' },
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

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: req.user.uid },
      include: {
         agentProfile: true, 
         properties: {
          orderBy: { createdAt: 'desc' }
         }
        },
    });
    if (!user) return res.status(404).json({ error: 'User not found in database' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/agent/:id', verifyToken, async (req, res) => {
  try {
    const agent = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        agentProfile: true,
        properties: { 
          where: { available: true }, 
          orderBy: { createdAt: 'desc' } },
      },
    });
    if (!agent || agent.role !== 'AGENT') return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
