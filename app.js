"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var ent = require("ent");
var guid_typescript_1 = require("guid-typescript");
var ejs = require("ejs-locals");
var path = require("path");
var User = /** @class */ (function () {
    function User(pseudo, roomId) {
        this._id = guid_typescript_1.Guid.create();
        this._pseudo = pseudo;
        this._roomId = roomId;
        this._devices = new Array();
    }
    Object.defineProperty(User.prototype, "Pseudo", {
        get: function () {
            return this._pseudo;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "Devices", {
        get: function () {
            return this._devices;
        },
        set: function (devices) {
            this._devices = devices;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "RoomId", {
        get: function () {
            return this._roomId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "Id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    return User;
}());
var Device = /** @class */ (function () {
    function Device(clientId, device) {
        this._id = guid_typescript_1.Guid.create();
        this._clientId = clientId;
        this._device = device;
        this.AllowedMessages = device.AllowedMessages;
    }
    Object.defineProperty(Device.prototype, "Device", {
        get: function () {
            return this._device;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Device.prototype, "VibratingIntensity", {
        get: function () {
            return this._vibratingIntensity;
        },
        set: function (vibratingIntensity) {
            this._vibratingIntensity = vibratingIntensity;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Device.prototype, "ClientId", {
        get: function () {
            return this._clientId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Device.prototype, "Id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    return Device;
}());
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejs);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/Assets'));
app.set("port", process.env.PORT || 3000);
var http = require("http").Server(app);
var io = require("socket.io")(http);
var users = new Array();
var usersSocket = {};
app.get('/room/:roomId([a-zA-Z0-9]{5})', function (req, res) {
    res.render('room', { title: 'ToyControl: Room' });
});
app.get('/solo', function (req, res) {
    res.render('solo', { title: 'ToyControl: Solo' });
});
app.get('/', function (req, res) {
    res.render('index', { title: 'ToyControl' });
});
app.get('/.well-known/acme-challenge/bPjofOpUDrNE_cxo9o6bmTFXxWgTS94NmSuAvD3y3sM', function (req, res) {
    res.send('bPjofOpUDrNE_cxo9o6bmTFXxWgTS94NmSuAvD3y3sM.MZD-CQlS-ewPv0cvACC6kP6rHWT5Fpoi71AHg6Djn-o');
});
io.on('connection', function (socket) {
    console.log("a user connected");
    socket.on('newUser', function (newUser) {
        newUser.pseudo = ent.encode(newUser.pseudo);
        var user = new User(newUser.pseudo, newUser.room);
        usersSocket[user.Id.toString()] = socket;
        socket.join(newUser.room);
        socket.roomId = newUser.room;
        console.log(socket.roomId);
        socket.pseudo = newUser.pseudo;
        socket.userId = user.Id;
        users.push(user);
        socket.emit('identity', user);
    });
    socket.on('disconnect', function () {
        console.log(socket.pseudo + ' left.');
        usersSocket[socket.userId] = null;
        var correspondingUser = users.filter(function (u) { return u.Id == socket.userId; });
        if (correspondingUser.length > 0) {
            var currentUser = correspondingUser[0];
            users.splice(users.indexOf(currentUser), 1);
            io.to(socket.roomId).emit('users', { users: users });
            console.log('Users still connected:');
            console.log({ users: users });
        }
    });
    socket.on('devices', function (devices) {
        socket.devices = devices;
        console.log('Begin devices');
        var currentUser = users.filter(function (u) { return u.Id == socket.userId; })[0];
        if (devices != null) {
            devices.forEach(function (device) {
                if (currentUser.Devices !== undefined) {
                    currentUser.Devices.push(new Device(currentUser.Id, device));
                }
            });
            if (currentUser.Devices !== undefined) {
                console.log(currentUser.Devices);
            }
        }
        console.log('roomId:' + socket.roomId);
        var roomUsers = users.filter(function (u) { return u.RoomId == socket.roomId; });
        io.to(socket.roomId).emit('users', { users: roomUsers });
        console.log({ users: users });
        console.log({ roomUsers: roomUsers });
        console.log({ pseudo: socket.pseudo, devices: socket.devices });
        console.log('End devices');
    });
    // Chat instruction, coming soon
    socket.on('message', function (message) {
        message = ent.encode(message);
        socket.to(socket.roomId).emit('message', { pseudo: socket.pseudo, message: message });
        console.log({ pseudo: socket.pseudo, message: message });
    });
    socket.on('start_toy', function (toyId) {
        var targetedUser = users.filter(function (u) { return u.Devices.some(function (d) { return d.Id == toyId; }); })[0];
        var targetedToy = targetedUser.Devices.filter(function (d) { return d.Id == toyId; })[0];
        targetedToy.VibratingIntensity = 1;
        io.to(socket.roomId).emit('users', { users: users });
        usersSocket[targetedUser.Id.toString()].emit('start_local_toy', targetedToy.Device);
    });
    socket.on('stop_toy', function (toyId) {
        var targetedUser = users.filter(function (u) { return u.Devices.some(function (d) { return d.Id == toyId; }); })[0];
        var targetedToy = targetedUser.Devices.filter(function (d) { return d.Id == toyId; })[0];
        targetedToy.VibratingIntensity = 0;
        io.to(socket.roomId).emit('users', { users: users });
        usersSocket[targetedUser.Id.toString()].emit('stop_local_toy', targetedToy.Device);
    });
});
var server = http.listen(process.env.PORT || 3000, function () {
    console.log("listening on " + process.env.PORT || "3000");
});
