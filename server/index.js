import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import interviewRoutes from './routes/interview.js';
import testRoutes from './routes/test.js';
import { connectDB } from './db.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve pure HTML5, CSS3, and JavaScript frontend from public/
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/interview', interviewRoutes);
app.use('/api/test', testRoutes);

// Health check route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Virtual Learning Platform Server (AI & Assessment Modules) is running smoothly!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await connectDB();
});