class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  generateRoomId() {
    return Math.random().toString(16).substring(2, 6).toUpperCase();
  }

  createRoom(roomId) {
    const room = {
      id: roomId,
      players: [],
      createdAt: new Date(),
      gameStarted: false,
      gameStartedAt: null,
      gameState: {
        resources: {} // playerId -> [5 numbers, 0-50 range]
      }
    };
    
    this.rooms.set(roomId, room);
    console.log(`Room ${roomId} created`);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getAllRooms() {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      playerCount: room.players.length,
      createdAt: room.createdAt
    }));
  }

  addPlayerToRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    if (!room.players.includes(playerId)) {
      room.players.push(playerId);
      room.gameState.resources[playerId] = [0, 0, 0, 0, 0]; // Initialize with 5 zeros (0-50 range)
      
      // Check if this is the second player (game can start)
      if (room.players.length === 2) {
        room.gameStarted = true;
        room.gameStartedAt = new Date();
      }
    }
    
    return true;
  }

  removePlayerFromRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.players = room.players.filter(id => id !== playerId);
    delete room.gameState.resources[playerId];

    // If room is empty, remove it
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} removed (empty)`);
    }

    return true;
  }

  removePlayerFromAllRooms(playerId) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.players.includes(playerId)) {
        this.removePlayerFromRoom(roomId, playerId);
        console.log(`Player ${playerId} removed from room ${roomId}`);
      }
    }
  }

  updatePlayerResources(roomId, playerId, resources) {
    const room = this.rooms.get(roomId);
    if (!room || !room.players.includes(playerId)) return false;

    // Validate resources (should be 5 numbers, 0-50 range)
    if (!Array.isArray(resources) || resources.length !== 5) {
      console.error('Invalid resources format. Expected array of 5 numbers.');
      return false;
    }

    // Validate each resource is between 0 and 50
    for (let i = 0; i < resources.length; i++) {
      if (typeof resources[i] !== 'number' || resources[i] < 0 || resources[i] > 50) {
        console.error(`Invalid resource value at index ${i}: ${resources[i]}. Must be between 0 and 50.`);
        return false;
      }
    }

    room.gameState.resources[playerId] = resources;
    return true;
  }

  getPlayerResources(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    return room.gameState.resources[playerId] || null;
  }

  getRoomGameState(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    return {
      players: room.players,
      resources: room.gameState.resources
    };
  }

  getGameStateForPlayer(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room || !room.players.includes(playerId)) return null;
    
    // Find opponent resources
    const opponentId = room.players.find(id => id !== playerId);
    const opponentResources = opponentId ? room.gameState.resources[opponentId] || [0, 0, 0, 0, 0] : [0, 0, 0, 0, 0];
    
    return {
      players: room.players,
      opponentResources: opponentResources,
      roomId: room.id
    };
  }

  isRoomFull(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.players.length >= 2 : false;
  }
}

// Export functions for backward compatibility
function generateRoomId() {
  return Math.random().toString(16).substring(2, 6).toUpperCase();
}

module.exports = {
  RoomManager,
  generateRoomId
};
