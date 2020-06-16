import * as express from "express";
import * as socketio from "socket.io";
import * as ent from "ent";
import { Guid } from "guid-typescript";
import * as ejs from "ejs-locals";
import * as path from "path";

class User {
    readonly _id: Guid;
    private _pseudo: string;
    private _roomId: string;
    private _devices: Array<any>;

    constructor(pseudo: string, roomId: string) {
        this._id = Guid.create();
        this._pseudo = pseudo;
        this._roomId = roomId;
        this._devices = new Array();
    }

    get Pseudo(): string {
        return this._pseudo;
    }

    get Devices(): Array<Device> {
        return this._devices;
    }

    get RoomId(): string {
        return this._roomId;
    }

    set Devices(devices: Array<Device>) {
        this._devices = devices;
    }

    get Id(): Guid {
        return this._id;
    }
}

class Device {
    readonly _id: Guid;
    private _clientId: Guid;
    private _currentState: DeviceState;
    private _targetedState: DeviceState;
    private _device: any;
    public AllowedMessages: any;

    constructor(clientId: Guid, device: any) {
        this._id = Guid.create();
        this._clientId = clientId;
        this._device = device;
        this.AllowedMessages = device.AllowedMessages;
    }

    get CurrentState(): DeviceState {
        return this._currentState;
    }

    set CurrentState(currentState: DeviceState) {
        this._currentState = currentState;
    }

    get TargetedState(): DeviceState {
        return this._targetedState;
    }

    set TargetedState(targetedState: DeviceState) {
        this._targetedState = targetedState;
    }

    get Device(): any {
        return this._device;
    }

    get ClientId(): Guid {
        return this._clientId;
    }

    get Id(): Guid {
        return this._id;
    }
}

class DeviceState {
    private _intensity: number;
    private _patternName: String;

    constructor(intensity, patternName) {
        this._intensity = intensity;
        this._patternName = patternName;
    }

    get Intensity(): number {
        return this._intensity;
    }

    get PatternName(): String {
        return this._patternName;
    }
}

const app = express();
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
let http = require("http").Server(app);
let io = require("socket.io")(http);
let users = new Array<User>();
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

io.on('connection', function (socket: any) {
    console.log("An user just arrived.");

    socket.on('newUser', function (newUser: any) {
        console.log("It's "+newUser.pseudo);
        newUser.pseudo = ent.encode(newUser.pseudo);
        let user = new User(newUser.pseudo, newUser.room);
        usersSocket[user.Id.toString()] = socket;
        socket.join(newUser.room);
        socket.roomId = newUser.room;
        console.log(socket.roomId);
        socket.pseudo = newUser.pseudo;
        socket.userId = user.Id;
        users.push(user);
        socket.emit('identity', user);

        let roomUsers = users.filter(u => u.RoomId == socket.roomId);

        console.log({ users: users });
        console.log({ roomUsers: roomUsers });
        console.log({ pseudo: socket.pseudo, devices: socket.devices });
        
        io.to(socket.roomId).emit('users', { users: roomUsers });
    });

    socket.on('disconnect', function () {
        usersSocket[socket.userId] = null;
        let correspondingUser = users.filter(u => u.Id == socket.userId);
        if (correspondingUser.length > 0) {
            let currentUser = correspondingUser[0];
            users.splice(users.indexOf(currentUser), 1);
            io.to(socket.roomId).emit('users', { users: users });
        }
    });

    socket.on('devices', function (devices: any) {
        socket.devices = devices;

        let currentUser = users.filter(u => u.Id == socket.userId)[0];
        if (devices != null) {
            if (currentUser.Devices !== undefined) {
                currentUser.Devices = new Array<Device>();
                devices.forEach(function (device) {
                    currentUser.Devices.push(new Device(currentUser.Id, device));
                });
                console.log(currentUser.Devices);
            }
        }
        
        let roomUsers = users.filter(u => u.RoomId == socket.roomId);
        io.to(socket.roomId).emit('users', { users: roomUsers });
    });

    socket.on('chat-message', function (message: string) {
        if (message != '' && socket.pseudo != '') {
            message = ent.encode(message);
            io.to(socket.roomId).emit('chat-message', { pseudo: socket.pseudo, message: message });
            console.log({ pseudo: socket.pseudo, message: message });
        }
    });

    socket.on('change_state', function (toyId: Guid, intensity: number, patternName: String) {
        if (users.some(u => u.Devices.some(d => d.Id == toyId))) {
            let targetedUser = users.filter(u => u.Devices.some(d => d.Id == toyId))[0];
            let targetedToy = targetedUser.Devices.filter(d => d.Id == toyId)[0];
            targetedToy.TargetedState = new DeviceState(intensity, patternName);

            usersSocket[targetedUser.Id.toString()].emit('change_state', targetedToy);            
        }
    });

    socket.on('update_state', function (serialized_device: any) {
        //Weird behavior if we don't do that        
        var s = JSON.stringify(serialized_device);
        let device = JSON.parse(s);

        if (users.some(u => u.Devices.some(d => d.Id.toString() == device._id.value))) {            
            let targetedUser = users.filter(u => u.Devices.some(d => d.Id.toString() == device._id.value))[0];            
            let targetedToy = targetedUser.Devices.filter(d => d.Id.toString() == device._id.value)[0];            
            targetedToy.CurrentState = device._currentState;
            io.to(socket.roomId).emit('users', { users: users });            
        }
    });
});

const server = http.listen(process.env.PORT || 3000, function () {
    console.log("listening on " + process.env.PORT || "3000");
});