const { Server } = require("socket.io");

const ROOMS = {};

let io;

function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: "*"
        }
    });

    return io;
}

module.exports = {
    initializeSocket,
    ROOMS,
    getIO: () => io
};