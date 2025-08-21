import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

let players = {}; // { socketId: { name, ticketNumber } }
let calledNumbers = [];

const HOST_PASSWORD = "admin123"; // fixed host password

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Player joins with name + ticket
  socket.on("joinGame", ({ name, ticketNumber }) => {
    players[socket.id] = { name, ticketNumber };
    io.emit("playersUpdate", players); // send to all players
  });

  // Host calls a number
  socket.on("callNumber", ({ number, password }) => {
    if (password !== HOST_PASSWORD) {
      socket.emit("errorMessage", "Invalid host password!");
      return;
    }
    if (!calledNumbers.includes(number)) {
      calledNumbers.push(number);
      io.emit("numberCalled", { number, calledNumbers });
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playersUpdate", players);
  });
});

app.get("/", (req, res) => {
  res.send("Backend running for Housie Game 🎉");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
