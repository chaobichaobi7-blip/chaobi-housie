// index.js (Backend for Render)
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
    methods: ["GET", "POST"],
  },
});

// ---- GAME STATE ----
let players = [];
let calledNumbers = [];
let currentNumber = null;
let prizes = ["Line 1", "Line 2", "Line 3", "Corners", "Full House"];
let winners = [];

// ---- UTILITIES ----
function generateTicket() {
  let ticket = Array.from({ length: 3 }, () => Array(9).fill(null));
  let available = Array.from({ length: 90 }, (_, i) => i + 1);

  for (let row = 0; row < 3; row++) {
    let nums = available.splice(0, 9);
    nums = nums.sort(() => Math.random() - 0.5).slice(0, 5).sort((a, b) => a - b);

    let positions = [];
    while (positions.length < 5) {
      let pos = Math.floor(Math.random() * 9);
      if (!positions.includes(pos)) positions.push(pos);
    }

    positions.forEach((pos, i) => {
      ticket[row][pos] = nums[i];
    });
  }
  return ticket;
}

// ---- SOCKET EVENTS ----
io.on("connection", (socket) => {
  console.log("🟢 A user connected");

  socket.on("join", ({ name, password }) => {
    const ticket = generateTicket();
    const ticketNumber = players.length + 1;

    const player = { id: socket.id, name, ticket, ticketNumber };
    players.push(player);

    socket.emit("ticket", ticket);
    socket.emit("ticket-number", ticketNumber);

    io.emit("players-list", players.map(p => ({
      name: p.name,
      ticket: p.ticket,
      ticketNumber: p.ticketNumber
    })));

    console.log(`👤 ${name} joined with Ticket #${ticketNumber}`);
  });

  socket.on("start-game", () => {
    calledNumbers = [];
    currentNumber = null;
    winners = [];
    io.emit("game-started", { prizes });
  });

  socket.on("call-number", () => {
    if (calledNumbers.length >= 90) return;

    let available = Array.from({ length: 90 }, (_, i) => i + 1).filter(
      (n) => !calledNumbers.includes(n)
    );

    let num = available[Math.floor(Math.random() * available.length)];
    calledNumbers.push(num);
    currentNumber = num;

    io.emit("number-called", num);
    io.emit("update-board", { calledNumbers, currentNumber });
  });

  socket.on("claim-prize", ({ prize }) => {
    if (winners.find(w => w.prize === prize)) {
      socket.emit("error-message", "❌ Prize already claimed!");
      return;
    }

    let player = players.find(p => p.id === socket.id);
    if (player) {
      const win = { name: player.name, ticketNumber: player.ticketNumber, prize };
      winners.push(win);
      io.emit("winner", win);
    }
  });

  socket.on("reset-game", () => {
    players = [];
    calledNumbers = [];
    currentNumber = null;
    winners = [];
    io.emit("game-reset");
  });

  socket.on("disconnect", () => {
    players = players.filter((p) => p.id !== socket.id);
    io.emit("players-list", players);
    console.log("🔴 A user disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
