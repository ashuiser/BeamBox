const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public_files')));

io.on('connection', function(socket) {
    console.log('A user connected');

    socket.on('sender-join', function(data) {
        socket.join(data.uid);
        console.log(`Sender created RoomID: ${data.uid}`);
    });

    socket.on('receiver-join', function(data) {
        socket.join(data.sender_uid);
        io.to(data.sender_uid).emit('init', data.uid);
        console.log(`Receiver joining RoomID:${data.uid} ${data.sender_uid}`);
        io.to(data.uid).emit("rec");
    });
    socket.on('file-meta', function(data) {
        console.log(`Received file metadata from sender for receiver ${data.metadata.receiver_uid}`);
        console.dir(data.metadata);
        io.emit('fs-meta', data.metadata);
        console.log(`Sent file metadata to receiver ${data.metadata.receiver_uid}`);
    });

    socket.on('fs-start', function(data) {
        console.log(`Receiver requested fs-start from sender ${data.sender_uid}`);
        io.to(data.sender_uid).emit('fs-share-sender', {});
    });

    socket.on('file-raw', function(data) {
        console.log(`Received file chunk from sender for receiver ${data.receiver_uid}`);
        io.emit('fs-share', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('error', (error) => {
        console.error('Socket Error:', error);
    });
});

server.listen(5000, () => {
    console.log('Server is listening on port 5000');
});
