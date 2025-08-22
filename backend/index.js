// server.js
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());

const io = new Server(server, { cors: { origin: "*" } });

// --------------------- Game State ---------------------
const TOTAL_TICKETS = 600;
let players = []; // { name, ticketNumber, ticketData }
let gameStarted = false;

// ----------------- Deterministic Ticket Generator -----------------
function rng(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickN(arr, n, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function genTicket(serial) {
  const r = rng(serial * 911 + 131);
  const cols = Array.from({ length: 9 }, (_, c) => {
    const start = c === 0 ? 1 : c * 10;
    const end = c === 8 ? 90 : c * 10 + 9;
    const pool = [];
    for (let n = start; n <= end; n++) pool.push(n);
    return pool;
  });

  const colCounts = Array(9).fill(1);
  let remaining = 15 - 9;
  while (remaining > 0) {
    const idx = Math.floor(r(serial + remaining) * 9);
    if (colCounts[idx] < 3) {
      colCounts[idx]++;
      remaining--;
    }
  }

  const colValues = cols.map((pool, c) => pickN(pool, colCounts[c], r).sort((a, b) => a - b));

  const rows = [[], [], []];
  const rowCounts = [0, 0, 0];
  function pickRows(k) {
    const order = [0, 1, 2].sort((a, b) => rowCounts[a] - rowCounts[b] || (r() - 0.5));
    return order.slice(0, k);
  }

  colValues.forEach((vals, c) => {
    const targets = pickRows(vals.length);
    vals.forEach((n, i) => {
      rows[targets[i]].push({ c, n });
      rowCounts[targets[i]]++;
    });
  });

  const cap = 5;
  for (let iter = 0; iter < 10; iter++) {
    let changed = false;
    for (let rIdx = 0; rIdx < 3; rIdx++) {
      while (rowCounts[rIdx] > cap) {
        const tgt = [0, 1, 2].filter(k => rowCounts[k] < cap).sort(() => r() - 0.5)[0];
        if (tgt == null) break;
        const moved = rows[rIdx].pop();
        if (rows[tgt].some(x => x.c === moved.c)) {
          rows[rIdx].unshift(moved);
          break;
        }
        rows[tgt].push(moved);
        rowCounts[rIdx]--;
        rowCounts[tgt]++;
        changed = true;
      }
    }
    if (!changed) break;
  }

  const grid = Array.from({ length: 3 }, () => Array(9).fill(null));
  rows.forEach((cells, rIdx) => {
    cells.sort((a, b) => a.c - b.c);
    cells.forEach(({ c, n }) => (grid[rIdx][c] = n));
  });

  return grid;
}

// Precompute all 600 tickets
const allTickets = new Map();
for (let i = 1; i <= TOTAL_TICKETS; i++) {
  allTickets.set(i, genTicket(i));
}

// --------------------- Routes ---------------------

// Join a ticket
app.post("/join", (req, res) => {
  const { name, ticket } = req.body;
  const ticketNumber = Number(ticket.replace("Ticket #", ""));
  if (!ticketNumber || ticketNumber < 1 || ticketNumber > TOTAL_TICKETS)
    return res.json({ success: false, error: "Invalid ticket" });

  if (players.find(p => p.ticketNumber === ticketNumber))
    return res.json({ success: false, error: "Ticket already taken" });

  const ticketData = allTickets.get(ticketNumber);
  const player = { name, ticketNumber, ticketData };
  players.push(player);

  io.emit("playerJoined", player);
  res.json({ success: true, ticketData });
});

// Host login
app.post("/host-login", (req, res) => {
  const { password } = req.body;
  if (password === "1234") return res.json({ success: true });
  res.json({ success: false });
});

// Fetch all players
app.get("/players", (req, res) => {
  res.json(players);
});

// Fetch game state
app.get("/state", (req, res) => {
  res.json({ gameStarted });
});

// Start game
app.post("/start", (req, res) => {
  gameStarted = true;
  io.emit("gameStarted");
  res.json({ success: true });
});

// Reset game
app.post("/reset", (req, res) => {
  players = [];
  gameStarted = false;
  io.emit("gameReset");
  res.json({ success: true });
});

// --------------------- Server ---------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
