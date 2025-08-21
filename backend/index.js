import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

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
function generateTicket() {
  // 3 rows × 9 columns
  let ticket = Array.from({ length: 3 }, () => Array(9).fill(null));

  // Each column has a number range
  const ranges = [
    [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
    [50, 59], [60, 69], [70, 79], [80, 90]
  ];

  // Pick numbers for each column
  let colNumbers = ranges.map(([min, max]) => {
    let nums = [];
    for (let i = min; i <= max; i++) nums.push(i);
    return nums;
  });

  // Fill 15 numbers total
  let count = 0;
  while (count < 15) {
    let col = Math.floor(Math.random() * 9);
    if (ticket[0][col] && ticket[1][col] && ticket[2][col]) continue; // full column

    let row = Math.floor(Math.random() * 3);
    if (ticket[row][col]) continue; // already filled

    if (colNumbers[col].length === 0) continue; // no more numbers in this column

    let numIdx = Math.floor(Math.random() * colNumbers[col].length);
    let num = colNumbers[col][numIdx];
    colNumbers[col].splice(numIdx, 1);

    ticket[row][col] = num;
    count++;
  }

  // Sort each column
  for (let c = 0; c < 9; c++) {
    let colVals = [];
    for (let r = 0; r < 3; r++) {
      if (ticket[r][c]) colVals.push(ticket[r][c]);
    }
    colVals.sort((a, b) => a - b);
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      if (ticket[r][c]) {
        ticket[r][c] = colVals[idx++];
      }
    }
  }

  return ticket;
}


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
