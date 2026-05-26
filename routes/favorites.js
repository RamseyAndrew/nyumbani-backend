const express = require('express');
const verifyToken = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET user favorites
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { firebaseId: req.user.uid } });
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: { property: { include: { agent: { select: { firstName: true, lastName: true, email: true } } } } },
    });
    res.json(favorites);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST toggle favorite
router.post('/:propertyId', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { firebaseId: req.user.uid } });
    const existing = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId: user.id, propertyId: req.params.propertyId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ favorited: false });
    }

    await prisma.favorite.create({ data: { userId: user.id, propertyId: req.params.propertyId } });
    res.json({ favorited: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
