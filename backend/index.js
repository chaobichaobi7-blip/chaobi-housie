import express from "express";
import cors from "cors";
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ✅ Allow frontend (Vercel) to connect
app.use(cors({ origin: "*" }));
app.use(express.json());

// In-memory players
let players = [];

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Player joins
app.post("/join", (req, res) => {
  const { name, ticket } = req.body;

  if (players.find((p) => p.ticket === ticket)) {
    return res.json({ success: false, error: "Ticket already taken" });
  }

  const newPlayer = { name, ticket };
  players.push(newPlayer);

  // 🔥 Notify all hosts in real-time
  io.emit("playerJoined", newPlayer);

  res.json({ success: true });
});

// Host login
app.post("/host-login", (req, res) => {
  const { password } = req.body;
  if (password === "1234") {
    return res.json({ success: true });
  }
  res.json({ success: false });
});

// Host fetch all players (optional fallback)
app.get("/players", (req, res) => {
  res.json(players);
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
