const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const rooms = {};

io.on("connection", socket => {

  socket.on("join-room", room => {
    socket.join(room);

    if (!rooms[room]) rooms[room] = { players:{}, music:null, chat:[] };

    rooms[room].players[socket.id] = { x:200, y:300 };

    socket.emit("state", rooms[room]);
    socket.to(room).emit("player-joined", {
      id: socket.id,
      player: rooms[room].players[socket.id]
    });
  });

  socket.on("move", d => {
    const r = rooms[d.room];
    if (r && r.players[socket.id]) {
      r.players[socket.id] = { x:d.x, y:d.y };
      socket.to(d.room).emit("player-move", { id:socket.id, x:d.x, y:d.y });
    }
  });

  socket.on("chat", d => {
    io.to(d.room).emit("chat", { id:socket.id, msg:d.msg });
  });

  socket.on("music", d => {
    socket.to(d.room).emit("music", d);
  });

  socket.on("disconnect", () => {
    for (const r in rooms) {
      if (rooms[r].players[socket.id]) {
        delete rooms[r].players[socket.id];
        socket.to(r).emit("player-left", socket.id);
      }
    }
  });
});

server.listen(3000, () => console.log("🚀 Server running"));
