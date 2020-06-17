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
    Object.defineProperty(Device.prototype, "CurrentState", {
        get: function () {
            return this._currentState;
        },
        set: function (currentState) {
            this._currentState = currentState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Device.prototype, "TargetedState", {
        get: function () {
            return this._targetedState;
        },
        set: function (targetedState) {
            this._targetedState = targetedState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Device.prototype, "Device", {
        get: function () {
            return this._device;
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
var DeviceState = /** @class */ (function () {
    function DeviceState(intensity, patternName) {
        this._intensity = intensity;
        this._patternName = patternName;
    }
    Object.defineProperty(DeviceState.prototype, "Intensity", {
        get: function () {
            return this._intensity;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DeviceState.prototype, "PatternName", {
        get: function () {
            return this._patternName;
        },
        enumerable: true,
        configurable: true
    });
    return DeviceState;
}());
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejs);
app.set('view engine', 'ejs');
app.use(function (req, res, next) {
    console.log("req:" + req.url);
    var xforwardedproto = req.headers["x-forwarded-proto"];
    if (xforwardedproto !== "https" && !req.headers.host.includes("localhost")) {
        // request was via http, so redirect to https
        res.redirect('https://' + req.headers.host + req.url);
    }
    else {
        next();
    }
});
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
io.on('connection', function (socket) {
    console.log("An user just arrived.");
    socket.on('newUser', function (newUser) {
        console.log("It's " + newUser.pseudo);
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
        var roomUsers = users.filter(function (u) { return u.RoomId == socket.roomId; });
        console.log({ users: users });
        console.log({ roomUsers: roomUsers });
        console.log({ pseudo: socket.pseudo, devices: socket.devices });
        io.to(socket.roomId).emit('users', { users: roomUsers });
    });
    socket.on('disconnect', function () {
        usersSocket[socket.userId] = null;
        var correspondingUser = users.filter(function (u) { return u.Id == socket.userId; });
        if (correspondingUser.length > 0) {
            var currentUser = correspondingUser[0];
            users.splice(users.indexOf(currentUser), 1);
            var roomUsers = users.filter(function (u) { return u.RoomId == socket.roomId; });
            io.to(socket.roomId).emit('users', { users: roomUsers });
        }
    });
    socket.on('devices', function (devices) {
        socket.devices = devices;
        var currentUser = users.filter(function (u) { return u.Id == socket.userId; })[0];
        if (devices != null) {
            if (currentUser.Devices !== undefined) {
                currentUser.Devices = new Array();
                devices.forEach(function (device) {
                    currentUser.Devices.push(new Device(currentUser.Id, device));
                });
                console.log(currentUser.Devices);
            }
        }
        var roomUsers = users.filter(function (u) { return u.RoomId == socket.roomId; });
        io.to(socket.roomId).emit('users', { users: roomUsers });
    });
    socket.on('chat-message', function (message) {
        if (message != '' && socket.pseudo != '') {
            message = message;
            io.to(socket.roomId).emit('chat-message', { pseudo: socket.pseudo, message: message });
            console.log({ pseudo: socket.pseudo, message: message });
        }
    });
    socket.on('change_state', function (toyId, intensity, patternName) {
        if (users.some(function (u) { return u.Devices.some(function (d) { return d.Id == toyId; }); })) {
            var targetedUser = users.filter(function (u) { return u.Devices.some(function (d) { return d.Id == toyId; }); })[0];
            var targetedToy = targetedUser.Devices.filter(function (d) { return d.Id == toyId; })[0];
            targetedToy.TargetedState = new DeviceState(intensity, patternName);
            usersSocket[targetedUser.Id.toString()].emit('change_state', targetedToy);
        }
    });
    socket.on('update_state', function (serialized_device) {
        //Weird behavior if we don't do that        
        var s = JSON.stringify(serialized_device);
        var device = JSON.parse(s);
        if (users.some(function (u) { return u.Devices.some(function (d) { return d.Id.toString() == device._id.value; }); })) {
            var targetedUser = users.filter(function (u) { return u.Devices.some(function (d) { return d.Id.toString() == device._id.value; }); })[0];
            var targetedToy = targetedUser.Devices.filter(function (d) { return d.Id.toString() == device._id.value; })[0];
            targetedToy.CurrentState = device._currentState;
            var roomUsers = users.filter(function (u) { return u.RoomId == socket.roomId; });
            io.to(socket.roomId).emit('users', { users: roomUsers });
        }
    });
});
var server = http.listen(process.env.PORT || 3000, function () {
    console.log("listening on " + process.env.PORT || "3000");
});
