var PairingRoom = require('../socketModels/pairingRooms.js');

//we don't need to keep track of old room

class PairingRoomSocket {
  constructor(io) {
    this.io = io;
    this.roomCount = 0;
    this.rooms = {};
    this.queuedRooms = [];
  }

  isRoomAvailable(){
    if(this.queuedRooms.length > 0) {
      return true;
    } else {
      return false;  
    }
  }

  addPlayer(playerId) {
    if(this.isRoomAvailable()){
      return this.fillAvailable(playerId);
    } else {
      return this.addNewRoom(playerId);
    }
  }

  addNewRoom(playerId) {
    var room = new PairingRoom(++this.roomCount);
    room.addPlayer(playerId, 2);
    this.queuedRooms.push(room);
    this.rooms[room.getRoomId()] = room;
    return room;
  }

  fillAvailable(playerId) {
    var room = this.queuedRooms.pop();
    room.addPlayer(playerId, 2);
    return room;
  }

};

module.exports.init = (io) => {
  const pairingRoomSocket = new PairingRoomSocket(io);
  console.log("running init, so waiting for a connection");
  
  io.on('connection', (socket) => {
    console.log(socket.id, ' user connected!');
    var room = pairingRoomSocket.addPlayer(socket.id);
    socket.join(`gameRoom${room.getRoomId()}`);
    if(room.isFull()) {
      io.sockets.in(`gameRoom${room.getRoomId()}`).emit('prompt', `${JSON.stringify(room.getPrompt())}`);
      io.sockets.in(`gameRoom${room.getRoomId()}`).emit('room id', `${room.getRoomId()}`);
    }

    socket.on('edit', (code, roomId)=>{
      //TODO
      var room = pairingRoomSocket.rooms[roomId];
      console.log('The code is: ', code);
      room.updateCode(code);
      socket.broadcast.to(`gameRoom${roomId}`).emit('edit', code);
      //emit the updated code
      //brodcast the updated code to the other person with
      //
    })

  });
}













