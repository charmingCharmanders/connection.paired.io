var PairingRoom = require('../socketModels/pairingRooms.js');

class PairingRoomSocket {

  constructor(io, numberOfRooms) {
    this.io = io;
    this.createRooms(numberOfRooms);
  }

  createRooms(numberOfRooms) {
    this.pairingRooms = [];
    for (var i = 0; i < numberOfRooms; i++) {
      this.pairingRooms.push(new PairingRoom(i));
    }
  }

  getAvailableRooms() {
    return this.pairingRooms.filter((pairingRoom, index) => {
      return !pairingRoom.isFull();
    });
  }

  // getMatchingRooms() {
  //   return this.pairingRooms.filter((pairingRoom, index) => {
  //     return !pairingRoom.isFull();
  //   });
  // }

  getFirstAvailableRoom() {
    return this.getAvailableRooms()[0];
  }

  startSession(socket) {
    console.log("running start session");
    socket.on('start session', (msg) => {
      var pairingRoom = this.getFirstAvailableRoom();
      if (!pairingRoom) {
        socket.emit('session started', false);
      } else {
        socket.emit('session started', true, pairingRoom.getRoomId());
      }
    });
  }

  //TODO FIX
  // joinGame(socket) {
  //   socket.on('join game', (bodyPartChosen, roomId) => {
  //     var gameRoom = this.gameRooms[roomId];
  //     if (gameRoom.bodyPartAvailable(bodyPartChosen)) {
  //       socket.join(`gameRoom${roomId}`);
  //       gameRoom.addPlayer(socket.id, bodyPartChosen);
  //       socket.emit('join game', true, bodyPartChosen, 3 - gameRoom.playersInRoom());
  //       this.playerJoined(socket, gameRoom, roomId);
  //     } else {
  //       socket.emit('join game', false);
  //     }
  //   });
  // }

  // leaveGame(socket) {
  //   socket.on('leave game', (roomId) => {
  //     var gameRoom = this.gameRooms[roomId];
  //     gameRoom.removePlayer(socket.id);
  //     this.io.to(`gameRoom${roomId}`).emit('player joined', 3 - gameRoom.playersInRoom());
  //   });
  // }

  // disconnect(socket) {
  //   socket.on('disconnecting', () => {
  //     Object.keys(socket.rooms).forEach((room, index) => {
  //       if (index > 0) {
  //         var roomIndex = /\d+/.exec(room);
  //         var gameRoom = this.gameRooms[parseInt(roomIndex[0])];
  //         gameRoom.removePlayer(socket.id);
  //         console.log('game left: ', roomIndex);
  //         this.io.to(`gameRoom${roomIndex}`).emit('player joined', 3 - gameRoom.playersInRoom());
  //       }
  //     });
  //   });
  // }

  // playerJoined(socket, gameRoom, roomId) {
  //   if (gameRoom.playersInRoom() < 3) {
  //     this.io.to(`gameRoom${roomId}`).emit('player joined', 3 - gameRoom.playersInRoom());
  //   } else {
  //     this.io.to(`gameRoom${roomId}`).emit('starting game', 50);
  //   }
  // }

  gameEnd(socket) {
    socket.on('game end', (userImage) => {
      var pairingRoom = this.getSocketPairingRoom(socket);
      var roomName = this.getSocketGameRoomName(socket);
      // this.io.to(roomName).emit('image complete', gameRoom.image);
      // gameRoom.deleteImage();
    });
  }

  getSocketPairingRoomName(socket) {
    return Object.keys(socket.rooms)[1];
  }

  getSocketPairingRoomId(socket) {
    return parseInt(/\d+/.exec(this.getSocketPairingRoomName(socket)));
  }

  getSocketPairingRoom(socket) {
    return this.gameRooms[this.getSocketPairingRoomId(socket)];
  }

};

module.exports.init = (io) => {
  const pairingRoomSocket = new PairingRoomSocket(io, 10);
  console.log("running init, so waiting for a connection");
  io.on('connect', (socket) => {
    console.log(socket.id, ' user connected!');

    // play game 
    pairingRoomSocket.startSession(socket);

    // join game room lobby
    // pairingRoomSocket.joinGame(socket);

    // // leave game room
    // pairingRoomSocket.leaveGame(socket);
    // pairingRoomSocket.disconnect(socket);

    // // end game
    // pairingRoomSocket.gameEnd(socket);

  });
}


