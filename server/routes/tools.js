const express = require('express');
const crypto = require('crypto');
const Tool = require('../models/Tool');

const router = express.Router();

const DEFAULT_TOOLS = [
  { name: 'Claude', url: 'https://claude.ai', cat: 'chat', icon: 'C' },
  { name: 'ChatGPT', url: 'https://chat.openai.com', cat: 'chat', icon: 'G' },
  { name: 'Gemini', url: 'https://gemini.google.com', cat: 'chat', icon: 'G' },
  { name: 'Perplexity', url: 'https://perplexity.ai', cat: 'research', icon: 'P' },
  { name: 'NotebookLM', url: 'https://notebooklm.google.com', cat: 'research', icon: 'N' },
  { name: 'GitHub Copilot', url: 'https://github.com/features/copilot', cat: 'coding', icon: 'C' },
  { name: 'Cursor', url: 'https://cursor.com', cat: 'coding', icon: 'Cu' },
  { name: 'v0', url: 'https://v0.dev', cat: 'coding', icon: 'V' },
  { name: 'Midjourney', url: 'https://midjourney.com', cat: 'image', icon: 'M' },
  { name: 'Canva', url: 'https://canva.com', cat: 'image', icon: 'Ca' },
  { name: 'Runway', url: 'https://runwayml.com', cat: 'video', icon: 'R' },
  { name: 'ElevenLabs', url: 'https://elevenlabs.io', cat: 'audio', icon: 'E' },
  { name: 'Notion AI', url: 'https://notion.so', cat: 'productivity', icon: 'N' },
];

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const [role, expiresAt, signature] = token ? token.split(':') : [];
  const payload = `${role}:${expiresAt}`;
  const expectedSignature = process.env.ADMIN_SESSION_SECRET
    ? crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('hex')
    : '';
  const signaturesMatch = signature
    && signature.length === expectedSignature.length
    && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (
    role !== 'admin'
    || !expiresAt
    || Number(expiresAt) <= Date.now()
    || !signaturesMatch
  ) {
    return res.status(401).json({ message: 'Admin permission required.' });
  }

  next();
}

router.get('/', async (_req, res) => {
  try {
    const tools = await Tool.find().sort({ createdAt: -1 });

    if (tools.length === 0) {
      const seeded = await Tool.insertMany(DEFAULT_TOOLS);
      return res.json(seeded);
    }

    res.json(tools);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch tools', error: error.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, url, cat, icon, description } = req.body;

  if (!name || !url || !cat) {
    return res.status(400).json({ message: 'Name, URL, and category are required.' });
  }

  try {
    const tool = await Tool.create({
      name: name.trim(),
      url: normalizeUrl(url),
      cat: cat.trim(),
      icon: (icon || name).trim().slice(0, 2).toUpperCase(),
      description: (description || '').trim(),
    });

    res.status(201).json(tool);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create tool', error: error.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { name, url, cat, icon ,description} = req.body;

  if (!name || !url || !cat) {
    return res.status(400).json({ message: 'Name, URL, and category are required.' });
  }

  try {
    const updated = await Tool.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        url: normalizeUrl(url),
        cat: cat.trim(),
        icon: (icon || name).trim().slice(0, 2).toUpperCase(),
        description: (description || '').trim(),
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update tool', error: error.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Tool.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    res.json({ success: true, id: deleted._id });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete tool', error: error.message });
  }
});

module.exports = router;
