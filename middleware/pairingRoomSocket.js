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

  fillAvailable(playerId, profileRating, profileId) {
    var room = this.queuedRooms.pop();
    room.addPlayer(playerId, profileRating, profileId);
    return room;
  }

  addNewRoom(playerId, profileRating, profileId) {
    var room = new PairingRoom(++this.roomCount);
    room.addPlayer(playerId, profileRating, profileId);
    this.queuedRooms.push(room);
    this.rooms[room.getRoomId()] = room;
    return room;
  }

  removeRoom(roomId) {
    if (this.rooms[roomId]) {
      this.rooms[roomId] = undefined;
    }
  }


  addPlayer(playerId, playerRating, profileId) {
    if (this.isRoomAvailable()) {
      return this.fillAvailable(playerId, playerRating, profileId);
    } else {
      return this.addNewRoom(playerId, playerRating, profileId);
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
    console.log(socket.id, socket.handshake.query, 'user connected!');

    const room = pairingRoomSocket.addPlayer(socket.id, null, socket.handshake.query.profileId);

    socket.on('disconnect', function() {
      console.log(socket.id, ' user disconnected!');
      room.removePlayer(socket.id);
      if (room.isEmpty()) {
        pairingRoomSocket.removeRoom(room.getRoomId());
      }
    });

    socket.join(`gameRoom${room.getRoomId()}`);

    if (room.isFull()) {
      console.log('creating a room:', room);
      room.retrievePrompt()
        .then(() => {
          const sessionData = {
            profileId1: room.getPlayers()[0].profileId,
            profileId2: room.getPlayers()[1].profileId,
            prompt: room.getPrompt(),
            roomId: room.getRoomId()
          };
          io.sockets.in(`gameRoom${room.getRoomId()}`).emit('startSession', sessionData);
        });
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
          const results = {
            error: null,
            testsCount: 0,
            testsPassed: 0,
            tests: []
          };
          try {
            // If function contains error it will be thrown
            eval(code);
            // Otherwise run the below code
            const functionBody = code.slice(code.indexOf('{') + 1, code.lastIndexOf('}'));
            const functionArgs = code.match(/function[^(]*\(([^)]*)\)/);
            const functionCode = new Function(functionArgs[1], functionBody);

            tests.models.forEach(test => {
              const functionParams = JSON.parse(`[${test.attributes.arguments}]`);
              const functionOutput = functionCode.apply(null, functionParams);
              const expectedOutput = JSON.parse(`${test.attributes.expectedOutput}`);

              results.testsCount = results.testsCount + 1;

              if (functionOutput === expectedOutput) {
                results.testsPassed = results.testsPassed + 1;
              }

              results.tests.push({
                description: test.attributes.description,
                result: assert(functionOutput === expectedOutput, `expected ${functionOutput} to equal ${expectedOutput}`)
              });
            });
          } catch (e) {
            if (e instanceof RangeError) {
              results.error = `Range Error: ${e.message}`;
            } else if (e instanceof ReferenceError) {
              results.error = `Reference Error: ${e.message}`;
            } else if (e instanceof SyntaxError) {
              results.error = `Syntax Error: ${e.message}`;
            } else if (e instanceof TypeError) {
              results.error = `Type Error: ${e.message}`;
            } else {
              results.error = 'Error: An unexpected error occured';
            }
          } finally {
            // Emit results to everyone in room
            io.sockets.in(`gameRoom${room.getRoomId()}`).emit('testResults', results);
          }
        })
        .catch(err => {
          console.error(err);
        });
    });
  });
};
