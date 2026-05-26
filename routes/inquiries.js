const express = require('express');
const { Resend } = require('resend');
const sanitizeHtml = require('sanitize-html');
const prisma = require('../lib/prisma');

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/:propertyId', async (req, res) => {
  const { name, email, message, userId } = req.body;
  const { propertyId } = req.params;
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { agent: { select: { email: true, firstName: true, lastName: true } } },
    });
    if (!property) return res.status(404).json({ error: 'Property not found' });

    const inquiry = await prisma.inquiry.create({
      data: { name, email, message, propertyId, ...(userId && { userId }) },
    });

    const agentEmail = property.agent?.email || process.env.AGENT_EMAIL;
    const sanitized = {
      name: sanitizeHtml(name, { allowedTags: [] }),
      email: sanitizeHtml(email, { allowedTags: [] }),
      message: sanitizeHtml(message, { allowedTags: [] }),
      title: sanitizeHtml(property.title, { allowedTags: [] }),
      county: sanitizeHtml(property.county, { allowedTags: [] }),
      subcounty: sanitizeHtml(property.subcounty, { allowedTags: [] }),
    };

    await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: agentEmail,
      subject: `New Inquiry: ${sanitized.title}`,
      html: `
        <h2>New Inquiry for ${sanitized.title}</h2>
        <p><strong>From:</strong> ${sanitized.name} (${sanitized.email})</p>
        <p><strong>Message:</strong> ${sanitized.message}</p>
        <p><strong>Property:</strong> ${sanitized.subcounty}, ${sanitized.county}</p>
      `,
    });

    res.status(201).json(inquiry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
