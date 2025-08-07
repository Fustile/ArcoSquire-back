const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { generateRoomId, RoomManager } = require('./src/roomManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Room manager instance
const roomManager = new RoomManager();

// REST API routes
app.get('/api/rooms', (req, res) => {
  const rooms = roomManager.getAllRooms();
  res.json({ rooms });
});

app.post('/api/rooms', (req, res) => {
  const roomId = generateRoomId();
  const room = roomManager.createRoom(roomId);
  res.json({ roomId, room });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = roomManager.getRoom(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({ room });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', (roomId) => {
    const room = roomManager.getRoom(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    socket.join(roomId);
    const playerAdded = roomManager.addPlayerToRoom(roomId, socket.id);
    
    if (playerAdded) {
      const updatedRoom = roomManager.getRoom(roomId);
      
      // Send room info to the joining player
      socket.emit('room-joined', { 
        roomId, 
        players: updatedRoom.players,
        gameStarted: updatedRoom.gameStarted,
        gameState: roomManager.getRoomGameState(roomId)
      });
      
      // Notify other players in the room
      socket.to(roomId).emit('player-joined', { 
        playerId: socket.id,
        gameStarted: updatedRoom.gameStarted,
        gameState: roomManager.getRoomGameState(roomId)
      });
      
      // If this is the second player, notify both players that game can start
      if (updatedRoom.gameStarted) {
        io.to(roomId).emit('game-started', {
          roomId,
          players: updatedRoom.players,
          gameState: roomManager.getRoomGameState(roomId)
        });
      }
      
      console.log(`Player ${socket.id} joined room ${roomId}. Players: ${updatedRoom.players.length}/2`);
    }
  });

  // Update game state
  socket.on('update-resources', (data) => {
    const { roomId, resources } = data;
    const room = roomManager.getRoom(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (!room.gameStarted) {
      socket.emit('error', { message: 'Game has not started yet. Wait for second player.' });
      return;
    }

    // Update player resources
    const updated = roomManager.updatePlayerResources(roomId, socket.id, resources);
    
    if (!updated) {
      socket.emit('error', { message: 'Invalid resources format. Each resource must be between 0 and 50.' });
      return;
    }
    
    // Broadcast updated game state to all players in the room
    const gameState = roomManager.getRoomGameState(roomId);
    io.to(roomId).emit('resources-updated', {
      playerId: socket.id,
      resources,
      gameState
    });
    
    console.log(`Resources updated for player ${socket.id} in room ${roomId}: [${resources.join(', ')}]`);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    roomManager.removePlayerFromAllRooms(socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server ready for real-time communication`);
});
