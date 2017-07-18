'use strict';
const express = require('express');
const path = require('path');
const middleware = require('./middleware');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);


var PairingRoom = require('./socketModels/pairingRooms.js');
var PairingRoomSocket = require('./middleware/pairingRoomSocket.js');

app.use(function (req, res, next) {
        // console.log(req.headers.host.split(':')[0]);
        res.setHeader('Access-Control-Allow-Origin', "http://"+req.headers.host.split(':')[0]+':3000');
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        next();
    }
);

PairingRoomSocket.init(io);

app.use(middleware.morgan('dev'));
app.use(middleware.cookieParser());
app.use(middleware.bodyParser.urlencoded({extended: false}));
app.use(middleware.bodyParser.json());

app.use(middleware.flash());

app.use(express.static(path.join(__dirname, '../public')));

module.exports = app;
