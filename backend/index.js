const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const path = require('path');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Make io accessible throughout Express app
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

const corsOptions = {
  // Allow all origins in development to enable local network access
  origin: process.env.NODE_ENV === 'production' ? false : '*'
};
app.use(cors(corsOptions));

// Serve React Build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/waste', require('./routes/waste'));

// React Catch-all Route
app.use((req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, '0.0.0.0', () => console.log(`Server started on port ${PORT}`));