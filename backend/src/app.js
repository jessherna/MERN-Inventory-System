import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();

// Enable CORS for all origins (you can restrict this in production)
app.use(cors());

// Parse incoming JSON payloads
app.use(express.json());

// === Routes ===

// Health check route
app.get('/api/ping', (req, res) => {
  return res.status(200).json({ msg: 'pong' });
});

// (Future routes will be mounted here, e.g. authRoutes, inventoryRoutes, itemRoutes)
// Example:
// import authRoutes from './routes/authRoutes.js';
// app.use('/api/auth', authRoutes);

// === Error Handling Middleware ===

// 404 handler for unknown endpoints
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
});

export default app;
