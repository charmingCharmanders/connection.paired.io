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

  fillPrivate(playerId, profileRating, profileId, roomId) {
    var room = this.rooms[roomId];
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

  addPrivateRoom(playerId, playerRating, profileId) {
    var room = new PairingRoom(++this.roomCount, helpers.translateRatingToDifficulty(playerRating));
    room.addPlayer(playerId, playerRating, profileId);
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

const runTests = (code, tests) => {
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
    return results;
  }
};

const calculateSessionScore = (timeLimitInSeconds, promptTime, promptDifficulty, tests, testsPassed) => {
  let diffObj = {1: 10, 2: 50, 3: 250, 4: 1000};
  let percentageOfTimeLimit = (timeLimitInSeconds - (promptTime)) / timeLimitInSeconds;
  let score = ((percentageOfTimeLimit * .40) + .60) * diffObj[promptDifficulty] * (testsPassed / tests);
  if (promptDifficulty === 1) {
    return score;
  } else {
    return score - (score % 5);
  }
};

const populateWithPrompt = function(room, io){
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
};

module.exports.init = (io) => {
  const pairingRoomSocket = new PairingRoomSocket(io);

  console.log('running init, so waiting for a connection');
  
  io.on('connection', (socket) => {
    var room;
    pairingRoomSocket.userCount++;
    pairingRoomSocket.usersOnline[socket.handshake.query.profileId]={inRoom: false, socket: socket.id};
    io.sockets.emit('users online', pairingRoomSocket.userCount);
    socket.on('join room', function() {
      room = pairingRoomSocket.addPlayer(socket.id, socket.handshake.query.rating, socket.handshake.query.profileId);
      pairingRoomSocket.usersOnline[socket.handshake.query.profileId].inRoom = true;
      console.log(socket.handshake.query.profileId, ' has been added to: ', room);
      socket.join(`gameRoom${room.getRoomId()}`);
      populateWithPrompt(room, io);
    });

    socket.on('friends list', function(data) {
      var friends = data.friendArray.map((friend)=>{
        var localFriendData = pairingRoomSocket.usersOnline[friend.friend.id];
        if(localFriendData) {
          friend.online = true;
          friend.inRoom = localFriendData.inRoom;
        }
        return friend;
      });
      socket.emit('friends list', friends);
    });

    socket.on('request session', function(friend) {
      var partner = pairingRoomSocket.usersOnline[friend.id];
      if(partner) {
        if(!partner.inRoom) {
          room = pairingRoomSocket.addPrivateRoom(socket.id, socket.handshake.query.rating, socket.handshake.query.profileId);
          pairingRoomSocket.usersOnline[socket.handshake.query.profileId].inRoom = true;
          partner.inRoom = true;
          socket.join(`gameRoom${room.getRoomId()}`);
          io.sockets.connected[partner.socket].emit('room request', {roomId: room.getRoomId()});
        } else {
          console.log('roomRequest Failed, because that person is already in a room');
        }
      }
    });

    socket.on('approve session request', function(roomId) {
      room = pairingRoomSocket.fillPrivate(socket.id, socket.handshake.query.rating, socket.handshake.query.profileId, roomId);
      console.log('the new room is:', room);
      pairingRoomSocket.usersOnline[socket.handshake.query.profileId].inRoom = true;
      console.log(socket.handshake.query.profileId, ' has been added to: ', room);
      socket.join(`gameRoom${room.getRoomId()}`);
      populateWithPrompt(room, io);
    });

    socket.on('reject session request', function(roomId) {
      console.log('reject session request');
      room = pairingRoomSocket.rooms[roomId];
      console.log('room is:', room);
      pairingRoomSocket.usersOnline[socket.handshake.query.profileId].inRoom = false;
      if(room){
        io.sockets.in(`gameRoom${room.getRoomId()}`).emit('session request rejected');
      }
    });

    socket.on('end session', (modalType) => {
      io.sockets.in(`gameRoom${room.getRoomId()}`).emit('end session', modalType);
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

    socket.on('submit code', (modalType, session, code) => {
      models.Test
        .where({ promptId: session.prompt.id })
        .fetchAll()
        .then(tests => {
          const testResults = runTests(code, tests);
          const sessionEndedAt = new Date();
          const sessionScore = calculateSessionScore(
            3600,
            (Date.parse(sessionEndedAt) - Date.parse(session.startedAt)) / 1000,
            session.prompt.difficulty,
            testResults.testsCount,
            testResults.testsPassed);

          models.Session
            .forge({
              profileId1: session.profileId1,
              profileId2: session.profileId2,
              promptId: session.prompt.id,
              rating: sessionScore,
              solutionCode: code,
              numberOfTests: testResults.testsCount,
              numberOfTestsPassed: testResults.testsPassed,
              startedAt: session.startedAt,
              endedAt: sessionEndedAt
            })
            .save()
            .catch(err => {
              console.error(err);
            });

          models.Profile
            .where({ id: session.profileId1 })
            .fetch()
            .then(profile => {
              profile.save({
                rating: profile.attributes.rating + sessionScore
              }, { method: 'update' });
            })
            .catch(err => {
              console.error(err);
            });

          models.Profile
            .where({ id: session.profileId2 })
            .fetch()
            .then(profile => {
              profile.save({
                rating: profile.attributes.rating + sessionScore
              }, { method: 'update' });
            })
            .catch(err => {
              console.error(err);
            });
        })
        .catch(err => {
          console.error(err);
        });

      // Emit to everyone in room
      io.sockets.in(`gameRoom${room.getRoomId()}`).emit('end session', modalType);
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
          const testResults = runTests(code, tests);
          // Emit results to everyone in room
          io.sockets.in(`gameRoom${room.getRoomId()}`).emit('testResults', testResults);
        })
        .catch(err => {
          console.error(err);
        });
    });
  });
};
