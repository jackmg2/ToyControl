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
    private _vibratingIntensity: number;
    private _patternName: String;
    private _device: any;
    public AllowedMessages: any;

    constructor(clientId: Guid, device: any) {
        this._id = Guid.create();
        this._clientId = clientId;
        this._device = device;
        this.AllowedMessages = device.AllowedMessages;
    }

    get Device(): any {
        return this._device;
    }

    get VibratingIntensity(): number {
        return this._vibratingIntensity;
    }

    set VibratingIntensity(vibratingIntensity: number) {
        this._vibratingIntensity = vibratingIntensity;
    }

    get PatternName(): String {
        return this._patternName;
    }

    set PatternName(patternName: String) {
        this._patternName = patternName;
    }

    get ClientId(): Guid {
        return this._clientId;
    }

    get Id(): Guid {
        return this._id;
    }
}

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejs);
app.set('view engine', 'ejs');
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
    console.log("a user connected");
    socket.on('newUser', function (newUser: any) {
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
    });

    socket.on('disconnect', function () {
        console.log(socket.pseudo + ' left.');
        usersSocket[socket.userId] = null;
        let correspondingUser = users.filter(u => u.Id == socket.userId);
        if (correspondingUser.length > 0) {
            let currentUser = correspondingUser[0];
            users.splice(users.indexOf(currentUser), 1);
            io.to(socket.roomId).emit('users', { users: users });
            console.log('Users still connected:');
            console.log({ users: users });
        }
    });

    socket.on('devices', function (devices: any) {
        socket.devices = devices;
        console.log('Begin devices');
        let currentUser = users.filter(u => u.Id == socket.userId)[0];
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
        let roomUsers = users.filter(u => u.RoomId == socket.roomId);
        io.to(socket.roomId).emit('users', { users: roomUsers });
        console.log({ users: users });
        console.log({ roomUsers: roomUsers });
        console.log({ pseudo: socket.pseudo, devices: socket.devices });

        console.log('End devices');
    });

    // Chat instruction, coming soon
    socket.on('message', function (message: string) {
        message = ent.encode(message);
        socket.to(socket.roomId).emit('message', { pseudo: socket.pseudo, message: message });
        console.log({ pseudo: socket.pseudo, message: message });
    });

    socket.on('start_toy', function (toyId: Guid) {
        if (users.some(u => u.Devices.some(d => d.Id == toyId))) {
            let targetedUser = users.filter(u => u.Devices.some(d => d.Id == toyId))[0];
            let targetedToy = targetedUser.Devices.filter(d => d.Id == toyId)[0];
            targetedToy.VibratingIntensity = 1;
            io.to(socket.roomId).emit('users', { users: users });
            usersSocket[targetedUser.Id.toString()].emit('start_local_toy', targetedToy.Device);
        }
    });

    socket.on('start_pattern', function (toyId: Guid, patternName: String) {
        console.log('ToyId: '+toyId+', pattern Name: '+patternName);
        if (users.some(u => u.Devices.some(d => d.Id == toyId))) {            
            console.log('ToyId: '+toyId+', pattern Name: '+patternName);
            let targetedUser = users.filter(u => u.Devices.some(d => d.Id == toyId))[0];
            let targetedToy = targetedUser.Devices.filter(d => d.Id == toyId)[0];
            targetedToy.VibratingIntensity = 1;
            io.to(socket.roomId).emit('users', { users: users });
            usersSocket[targetedUser.Id.toString()].emit('start_local_pattern', targetedToy.Device, patternName);
        }
    });

    socket.on('stop_toy', function (toyId: Guid) {
        if (users.some(u => u.Devices.some(d => d.Id == toyId))) {
            let targetedUser = users.filter(u => u.Devices.some(d => d.Id == toyId))[0];
            let targetedToy = targetedUser.Devices.filter(d => d.Id == toyId)[0];
            targetedToy.VibratingIntensity = 0;
            targetedToy.PatternName = '';
            io.to(socket.roomId).emit('users', { users: users });
            usersSocket[targetedUser.Id.toString()].emit('stop_local_toy', targetedToy.Device);
        }
    });
});

const server = http.listen(process.env.PORT || 3000, function () {
    console.log("listening on " + process.env.PORT || "3000");
});