import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

let players = {}; // { socketId: { name, ticket } }
let calledNumbers = [];
let currentNumber = null;

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("joinGame", ({ name, ticket }) => {
    players[socket.id] = { name, ticket };
    io.emit("playersUpdate", players);
  });

  socket.on("callNumber", () => {
    if (calledNumbers.length >= 90) return;
    let num;
    do {
      num = Math.floor(Math.random() * 90) + 1;
    } while (calledNumbers.includes(num));
    calledNumbers.push(num);
    currentNumber = num;
    io.emit("numberCalled", { num, calledNumbers });
  });

  socket.on("resetGame", () => {
    players = {};
    calledNumbers = [];
    currentNumber = null;
    io.emit("gameReset");
    io.emit("playersUpdate", players);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playersUpdate", players);
  });
});

app.get("/", (req, res) => {
  res.send("Housie Backend is running!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
