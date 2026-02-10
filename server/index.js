require("dotenv").config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});

const GridManager = require('./GridManager');

const gridManager = new GridManager(20, 2000);

const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 60%)`;
};

io.on('connection', (socket) => {


  const userColor = getRandomColor();

  socket.emit('init_state', gridManager.getGridState());
  socket.emit('leaderboard_update', gridManager.getLeaderboard());

  socket.on('join_game', (name) => {
    const cleanName = name && name.trim().length > 0 ? name.substring(0, 15) : `Player ${socket.id.substr(0, 4)}`;
    gridManager.addUser(socket.id, cleanName, userColor);

    socket.emit('player_info', { id: socket.id, color: userColor, name: cleanName });
    io.emit('leaderboard_update', gridManager.getLeaderboard());
  });

  socket.on('capture_block', ({ x, y }) => {
    try {
      const result = gridManager.canCapture(socket.id, x, y);

      if (!result.allowed) {
        socket.emit('capture_error', { message: result.error, x, y });
        return;
      }

      const blockData = gridManager.captureBlock(socket.id, x, y);
      io.emit('block_update', blockData);
      io.emit('leaderboard_update', gridManager.getLeaderboard());

    } catch (e) {
      console.error(e);
      socket.emit('error_message', e.message);
    }
  });

  socket.on('disconnect', () => {
    gridManager.removeUser(socket.id);
    io.emit('leaderboard_update', gridManager.getLeaderboard());
  });
});

app.get('*', (req, res) => {
  if (fs.existsSync(path.join(clientDistPath, 'index.html'))) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  } else {
    res.send('Server is running! Frontend is hosted separately.');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING on port ${PORT}`);
});
