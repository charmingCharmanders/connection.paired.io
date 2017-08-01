const PairingRoom = require('../socketModels/pairingRooms.js');
const helpers = require('./helpers');
const models = require('../db/models');
// const helper = require('../socketModels/h')

class PairingRoomSocket {
  constructor(io) {
    this.usersOnline={};
    this.io = io;
    this.roomCount = 0;
    this.rooms = {};
    this.queuedRooms = [];
    this.userCount = 0;
  }

  isRoomAvailable(difficulty) {
    for(var i = 0; i < this.queuedRooms.length; i++) {
      if(this.queuedRooms[i].getDifficulty() === difficulty){
        return true;
      }
    }
    return false;
  }

  fillAvailable(playerId, profileRating, profileId) {
    var room = this.queuedRooms.pop();
    room.addPlayer(playerId, profileRating, profileId);
    return room;
  }

  addNewRoom(playerId, playerRating, profileId) {
    var room = new PairingRoom(++this.roomCount, helpers.translateRatingToDifficulty(playerRating));
    room.addPlayer(playerId, playerRating, profileId);
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
    if (this.isRoomAvailable(helpers.translateRatingToDifficulty(playerRating))) {
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
    var room;
    pairingRoomSocket.userCount++;
    pairingRoomSocket.usersOnline[socket.handshake.query.profileId]={inRoom: false};
    io.sockets.emit('users online', pairingRoomSocket.userCount);
    socket.on('join room', function() {
      room = pairingRoomSocket.addPlayer(socket.id, socket.handshake.query.rating, socket.handshake.query.profileId);
      pairingRoomSocket.usersOnline[socket.handshake.query.profileId].inRoom = true;
      console.log(socket.handshake.query.profileId, ' has been added to: ', room);
      socket.join(`gameRoom${room.getRoomId()}`);
      if (room.isFull()) {
        room.retrievePrompt()
          .then(() => {
            console.log('the room with the prompt is:', room);
            const sessionData = {
              profileId1: room.getPlayers()[0].profileId,
              profileId2: room.getPlayers()[1].profileId,
              prompt: room.getPrompt(),
              roomId: room.getRoomId(),
              code: null,
              startedAt: new Date(),
              testResults: {}
            };
            io.sockets.in(`gameRoom${room.getRoomId()}`)
              .emit('startSession', sessionData);
          })
          .catch(err => {
            console.log('there was an error:', err);
          });
      }
    });

    socket.on('request session', function(requestedUserId) {
      console.log('userId:', requestedUserId);
    });

    socket.on('friends list', function(data) {
      var friends = data.friendArray.map((friend)=>{
        var localFriendData = pairingRoomSocket.usersOnline[friend.friend.profileId];
        if(localFriendData) {
          friend.online = true;
          friend.inRoom = localFriendData.inRoom;
        }
        return friend;
      });
      socket.emit('friends list', friends);
      console.log(friends);
    });

    socket.on('send room request', function() {
      console.log('reached the endpoint for the send room request', socket.handshake.query);
    });

    socket.on('leave room', function() {
      if(room) {
        console.log(socket.id, ' user is leaving room ',room.getRoomId());
        pairingRoomSocket.usersOnline[socket.handshake.query.profileId] = false;
        room.removePlayer(socket.id);
        socket.leave(`gameRoom${room.getRoomId()}`);
        if (room.isEmpty()) {
          pairingRoomSocket.removeRoom(room.getRoomId());
        }
      }
    });

    socket.on('submit code', () => {
      io.sockets.in(`gameRoom${room.getRoomId()}`).emit('submit code');
      if(room) {
        console.log(socket.id, ' user is leaving room ',room.getRoomId());
        room.removePlayer(socket.id);
        socket.leave(`gameRoom${room.getRoomId()}`);
        if (room.isEmpty()) {
          pairingRoomSocket.removeRoom(room.getRoomId());
        }
      }
    });

    socket.on('disconnect', function() {
      pairingRoomSocket.userCount--;
      delete pairingRoomSocket.usersOnline[socket.handshake.query.profileId];
      io.sockets.emit('users online', pairingRoomSocket.userCount);
      console.log(socket.id, ' user disconnected!');
      if(room) {
        console.log(socket.id, ' user is leaving room ',room.getRoomId());
        room.removePlayer(socket.id);
        socket.leave(`gameRoom${room.getRoomId()}`);
        if (room.isEmpty()) {
          pairingRoomSocket.removeRoom(room.getRoomId());
        }
      }
    });

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
