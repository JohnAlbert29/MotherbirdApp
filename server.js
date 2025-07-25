require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// In-memory storage (for development - use a database in production)
const syncStore = new Map();

// Generate a random 4-digit code
function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

app.post('/api/sync', (req, res) => {
    try {
        const { code, data } = req.body;
        
        // 1. First validate the code format
        if (!code || !/^\d{4}$/.test(code)) {
            return res.status(400).json({ error: 'Invalid 4-digit code format' });
        }

        // 2. Then check if data exists
        if (!data) {
            return res.status(400).json({ error: 'Data is required' });
        }

        // 3. NOW check for code conflicts
        if (syncStore.has(code)) {
            return res.status(409).json({ error: 'Code already in use' });
        }

        // 4. Only if all checks pass, store the data
        const expiresAt = Date.now() + 3600000; // 1 hour expiration
        syncStore.set(code, {
            data,
            expiresAt,
            createdAt: new Date().toISOString()
        });

        res.json({ 
            success: true,
            code,
            expiresAt
        });

    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Retrieve data with a sync code
app.get('/api/sync/:code', (req, res) => {
  try {
    const { code } = req.params;

    if (!syncStore.has(code)) {
      return res.status(404).json({ error: 'Invalid or expired code' });
    }

    const syncData = syncStore.get(code);

    if (syncData.expiresAt < Date.now()) {
      syncStore.delete(code);
      return res.status(410).json({ error: 'Code has expired' });
    }

    res.json({ data: syncData.data });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});