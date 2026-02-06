// ai-service/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json());

// Import routes
const aiRoutes = require('./routes/aiRoutes');

// Routes
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AI Service', port: process.env.PORT || 5001 });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🤖 AI Service running on port ${PORT}`);
});

