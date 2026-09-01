const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const crypto = require('crypto');

const toolRoutes = require('./routes/tools');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const frontendURL = process.env.FRONTEND_URL;
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (frontendURL && origin === frontendURL) return callback(null, true);
    // Allow any http or https localhost origin for development
    if (/^https?:\/\/localhost:[0-9]+$/.test(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  }
};
app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!configuredPassword || !sessionSecret) {
    return res.status(503).json({ message: 'Admin authentication is not configured.' });
  }

  const passwordBuffer = typeof password === 'string' ? Buffer.from(password) : Buffer.alloc(0);
  const configuredPasswordBuffer = Buffer.from(configuredPassword);
  const passwordMatches = passwordBuffer.length === configuredPasswordBuffer.length
    && crypto.timingSafeEqual(passwordBuffer, configuredPasswordBuffer);

  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid admin password.' });
  }

  const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
  const payload = `admin:${expiresAt}`;
  const signature = crypto.createHmac('sha256', sessionSecret).update(payload).digest('hex');
  res.json({ token: `${payload}:${signature}`, expiresAt });
});

app.use('/api/tools', toolRoutes);

async function startServer() {
  let mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    const memoryServer = await MongoMemoryServer.create();
    mongoUri = memoryServer.getUri();
    console.log('Using in-memory MongoDB for local development');
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
