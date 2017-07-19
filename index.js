'use strict';
const express = require('express');
const path = require('path');
const middleware = require('./middleware');
const app = express();
const http = require( 'http' ).Server( app );
const io = require('socket.io')(http);

var PairingRoom = require('./socketModels/pairingRooms.js');
var PairingRoomSocket = require('./middleware/pairingRoomSocket.js');

const PORT = process.env.port || 3001;

http.listen(PORT, () => {
  console.log('Example app listening on port 3001!');
});

PairingRoomSocket.init(io);
