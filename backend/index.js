import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let players = [];
let calledNumbers = [];
let currentNumber = null;
let takenTickets = new Set();

io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);

  // player joins
  socket.on("joinGame", ({ name, password }) => {
    const isHost = password === "admin123";

    players.push({
      id: socket.id,
      name,
      ticket: null, // chosen later
      isHost,
    });

    io.emit("playersUpdate", players);
    io.emit("ticketsUpdate", Array.from(takenTickets));
  });

  // ticket selection
  socket.on("selectTicket", (ticketNumber) => {
    if (takenTickets.has(ticketNumber)) {
      socket.emit("ticketError", "Ticket already taken!");
      return;
    }

    takenTickets.add(ticketNumber);

    players = players.map((p) =>
      p.id === socket.id ? { ...p, ticket: ticketNumber } : p
    );

    io.emit("playersUpdate", players);
    io.emit("ticketsUpdate", Array.from(takenTickets));
  });

  // reset game
  socket.on("resetGame", () => {
    players = [];
    calledNumbers = [];
    currentNumber = null;
    takenTickets.clear();
    io.emit("gameReset");
  });

  // disconnect
  socket.on("disconnect", () => {
    const player = players.find((p) => p.id === socket.id);
    if (player && player.ticket) {
      takenTickets.delete(player.ticket);
    }
    players = players.filter((p) => p.id !== socket.id);

    io.emit("playersUpdate", players);
    io.emit("ticketsUpdate", Array.from(takenTickets));
    console.log("Player disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
