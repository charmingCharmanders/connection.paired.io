var PairingRoom = require('../socketModels/pairingRooms.js');

class PairingRoomSocket {
  constructor(io) {
    this.io = io;
    this.roomCount = 0;
    this.rooms = {};
    this.queuedRooms = [];
  }

  isRoomAvailable() {
    if (this.queuedRooms.length > 0) {
      return true;
    } else {
      return false;  
    }
  }

  fillAvailable(playerId) {
    var room = this.queuedRooms.pop();
    room.addPlayer(playerId, 2);
    return room;
  }

  addNewRoom(playerId) {
    var room = new PairingRoom(++this.roomCount);
    room.addPlayer(playerId, 2);
    this.queuedRooms.push(room);
    this.rooms[room.getRoomId()] = room;
    return room;
  }

  addPlayer(playerId) {
    if (this.isRoomAvailable()) {
      return this.fillAvailable(playerId);
    } else {
      return this.addNewRoom(playerId);
    }
  }
}

module.exports.init = (io) => {
  const pairingRoomSocket = new PairingRoomSocket(io);

  console.log('running init, so waiting for a connection');
  
  io.on('connection', (socket) => {
    console.log(socket.id, ' user connected!');

    const room = pairingRoomSocket.addPlayer(socket.id);
    room.retrievePrompt();

    socket.join(`gameRoom${room.getRoomId()}`);

    if (room.isFull()) {
      io.sockets.in(`gameRoom${room.getRoomId()}`).emit('prompt', `${JSON.stringify(room.getPrompt())}`);
      io.sockets.in(`gameRoom${room.getRoomId()}`).emit('room id', `${room.getRoomId()}`);
    }

    socket.on('edit', (code, roomId) => {
      const room = pairingRoomSocket.rooms[roomId];
      console.log('The code is: ', code);
      room.updateCode(code);
      socket.broadcast.to(`gameRoom${roomId}`).emit('edit', code);
      // emit the updated code
    });
  });
};
