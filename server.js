const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map();

function getRoomUsers(room) {
    const users = rooms.get(room);

    if (!users) {
        return [];
    }

    return [...users.values()];
}

function addUser(room, user) {
    if (!rooms.has(room)) {
        rooms.set(room, new Map());
    }

    rooms.get(room).set(user.id, user);
}

function removeUser(room, socketId) {
    const users = rooms.get(room);

    if (!users) {
        return null;
    }

    const user = users.get(socketId);

    users.delete(socketId);

    if (users.size === 0) {
        rooms.delete(room);
    }

    return user;
}

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    // JOIN ROOM
    socket.on("join-room", ({ username, room }) => {

        username = String(username || "")
            .trim()
            .slice(0, 25);

        room = String(room || "general")
            .trim()
            .toLowerCase()
            .slice(0, 30);

        if (!username) {
            socket.emit(
                "join-error",
                "Please enter your name."
            );

            return;
        }

        if (!room) {
            room = "general";
        }

        const user = {
            id: socket.id,
            username: username,
            room: room
        };

        socket.join(room);

        socket.data.user = user;

        addUser(room, user);

        socket.emit("joined", {
            user: user,
            users: getRoomUsers(room)
        });

        socket.to(room).emit("system-message", {
            text: `${username} joined the chat`,
            time: new Date().toISOString()
        });

        io.to(room).emit(
            "room-users",
            getRoomUsers(room)
        );
    });

    // SEND MESSAGE
    socket.on("send-message", ({ text }) => {

        const user = socket.data.user;

        if (!user) {
            return;
        }

        text = String(text || "")
            .trim()
            .slice(0, 1000);

        if (!text) {
            return;
        }

        io.to(user.room).emit("new-message", {

            id:
                Date.now().toString() +
                Math.random().toString(16).slice(2),

            username: user.username,

            text: text,

            time: new Date().toISOString(),

            senderId: socket.id
        });
    });

    // TYPING INDICATOR
    socket.on("typing", (isTyping) => {

        const user = socket.data.user;

        if (!user) {
            return;
        }

        socket.to(user.room).emit("typing", {

            username: user.username,

            isTyping: Boolean(isTyping)
        });
    });

    // USER DISCONNECT
    socket.on("disconnect", () => {

        const user = socket.data.user;

        if (!user) {
            return;
        }

        const removed = removeUser(
            user.room,
            socket.id
        );

        if (removed) {

            socket.to(user.room).emit(
                "system-message",
                {
                    text: `${removed.username} left the chat`,
                    time: new Date().toISOString()
                }
            );

            io.to(user.room).emit(
                "room-users",
                getRoomUsers(user.room)
            );
        }

        console.log(
            "User disconnected:",
            socket.id
        );
    });
});

server.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});