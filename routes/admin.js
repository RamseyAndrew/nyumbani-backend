const express = require('express');
const { Resend } = require('resend');
const verifyToken = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

function requireAdmin(req, res, next) {
  if (req.dbUser?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Attach dbUser to req for all admin routes
router.use(verifyToken, async (req, res, next) => {
  try {
    req.dbUser = await prisma.user.findUnique({ where: { firebaseId: req.user.uid } });
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET all users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { agentProfile: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET pending agents
router.get('/agents/pending', requireAdmin, async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT', status: 'PENDING' },
      include: { agentProfile: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(agents);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH approve agent
router.patch('/agents/:id/approve', requireAdmin, async (req, res) => {
  try {
    const agent = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
      include: { agentProfile: true },
    });

    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';
    await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: agent.email || process.env.AGENT_EMAIL,
      subject: 'Your Nyumbani agent account has been approved!',
      html: `
        <h2>Welcome to Nyumbani, ${agent.firstName}!</h2>
        <p>Your agent account has been approved. You can now log in and start listing properties.</p>
        <a href="${dashboardUrl}/dashboard" style="background:#1B4332;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Go to Dashboard</a>
      `,
    });

    res.json(agent);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH reject / suspend agent
router.patch('/agents/:id/reject', requireAdmin, async (req, res) => {
  try {
    const agent = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: 'SUSPENDED' },
    });
    res.json(agent);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE user (fraud)
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
