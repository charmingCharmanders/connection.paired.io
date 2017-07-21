const PairingRoom = require('../socketModels/pairingRooms.js');
const models = require('../db/models');

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

  removeRoom(roomId) {
    if (this.rooms[roomId]) {
      this.rooms[roomId] = undefined;
    }
  }


  addPlayer(playerId) {
    if (this.isRoomAvailable()) {
      return this.fillAvailable(playerId);
    } else {
      return this.addNewRoom(playerId);
    }
  }

}

const assert = (expectedBehavior, descriptionOfCorrectBehavior) => {
  if (expectedBehavior) {
    return 'test passed';
  } else {
    return descriptionOfCorrectBehavior;
  }
};

module.exports.init = (io) => {
  const pairingRoomSocket = new PairingRoomSocket(io);

  console.log('running init, so waiting for a connection');
  
  io.on('connection', (socket) => {
    console.log(socket.id, ' user connected!');

    const room = pairingRoomSocket.addPlayer(socket.id);
    room.retrievePrompt();

    socket.on('disconnect', function() {
      room.removePlayer(socket.id);
      if (room.isEmpty()) {
        pairingRoomSocket.removeRoom(room.getRoomId());
      }
    });

    socket.join(`gameRoom${room.getRoomId()}`);

    if (room.isFull()) {
      console.log('creating a room:', room);
      io.sockets.in(`gameRoom${room.getRoomId()}`).emit('prompt', room.getPrompt());
      io.sockets.in(`gameRoom${room.getRoomId()}`).emit('room id', room.getRoomId());
    }

    socket.on('edit', (code, roomId) => {
      const room = pairingRoomSocket.rooms[roomId];
      room.updateCode(code);
      socket.broadcast.to(`gameRoom${roomId}`).emit('edit', code);
    });

    socket.on('test', (promptId, code, roomId) => {
      models.Test
        .where({ promptId: promptId })
        .fetchAll()
        .then(tests => {
          const results = [];
          const functionBody = code.slice(code.indexOf('{') + 1, code.lastIndexOf('}'));
          const functionArgs = code.match(/function[^(]*\(([^)]*)\)/);
          const functionCode = new Function(functionArgs[1], functionBody);

          tests.models.forEach(test => {
            const functionArgs = JSON.parse(`[${test.attributes.arguments}]`);
            const functionOutput = functionCode.apply(null, functionArgs);
            const expectedOutput = JSON.parse(`${test.attributes.expectedOutput}`);

            results.push({
              description: test.attributes.description,
              result: assert(functionOutput === expectedOutput, `expected ${functionOutput} to equal ${expectedOutput}`)
            });
          });

          // Emit event to everyone in room
          io.sockets.in(`gameRoom${room.getRoomId()}`).emit('testResults', results);
        })
        .catch(err => {
          console.error(err);
        });
    });
  });
};
