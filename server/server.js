const http = require('http')
const express = require('express');
const app = express();
const socketIo = require('socket.io');
const fs = require('fs');

const server = http.Server(app).listen(8080);
const io = socketIo(server);
const clients = {};

app.use(express.static(__dirname + '/../dist/'));
app.use(express.static(__dirname + '/../node_modules/'));

app.get('/', (req, res) => {
    const stream = fs.createReadStream(__dirname + '/../dist/index.html');
    stream.pipe(res);
});

const players = {}
let unmatched;

io.on('connection', function(socket) {
    const id = socket.id;

    console.log('Новый клиент присоеденился. ID: ', socket.id);
    clients[socket.id] = socket;

    socket.on('disconnect', () => {
        console.log('Клиент отсоеденился. ID: ', socket.id);
        delete clients[socket.id];
        socket.broadcast.emit('clientdisconnect', id);
    });

    join(socket)

    if (opponentOf(socket)) {
        socket.emit('game.begin', {
            symbol: players[socket.id].symbol
        });

        opponentOf(socket).emit('game.begin', {
            symbol: players[opponentOf(socket).id].symbol
        });
    }


    socket.on('make.move', function(data) {
        if (!opponentOf(socket)) {
            return;
        }


        socket.emit('move.made', data)
        opponentOf(socket).emit('move.made', data)
    });

    socket.on('disconnect', function() {
        if (opponentOf(socket)) {
            opponentOf(socket).emit('opponent.left');
        }
    });
});

const join = function(socket) {
    players[socket.id] = {
        opponent: unmatched,
        symbol: 'X',
        socket: socket
    }

    if (unmatched) {
        players[socket.id].symbol = 'O';
        players[unmatched].opponent = socket.id;
        unmatched = null;
    } else {
        unmatched = socket.id;
    }
}

const opponentOf = function(socket) {
    if (!players[socket.id].opponent) {
        return;
    }
    return players[players[socket.id].opponent].socket;
}