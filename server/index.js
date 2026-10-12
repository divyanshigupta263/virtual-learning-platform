import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import interviewRoutes from './routes/interview.js';
import testRoutes from './routes/test.js';
import { connectDB } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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