const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let players = [];
let calledNumbers = [];
let gameStarted = false;
let ticketCounter = 0;
const MAX_TICKETS = 600;
const HOST_PASSWORD = "admin123";
let hostId = null;
let winnersCount = 0;
let numberInterval = null;

const PRIZES = [
  "Quick Five",
  "First Line",
  "Second Line",
  "Third Line",
  "Full House 1",
  "Full House 2",
  "Full House 3",
];

let prizeWinners = {};

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on('join', ({ name, password }) => {
    if (ticketCounter >= MAX_TICKETS) {
      socket.emit('error-message', 'Maximum number of tickets reached (600)');
      return;
    }

    if (!hostId && password === HOST_PASSWORD) {
      hostId = socket.id;
      console.log("🎯 Host joined");
    }

    const ticket = generateTicket();
    const ticketNumber = ++ticketCounter;

    const player = {
      id: socket.id,
      name,
      ticket,
      ticketNumber,
      marked: [],
      winner: false,
    };

    players.push(player);

    socket.emit('ticket', ticket);
    socket.emit('ticket-number', ticketNumber);

    io.emit('players-list', players.map(p => ({
      name: p.name,
      ticketNumber: p.ticketNumber,
      ticket: p.ticket
    })));
  });

  socket.on('start-game', () => {
    if (socket.id !== hostId) return;
    if (gameStarted) return;

    gameStarted = true;
    calledNumbers = [];
    winnersCount = 0;
    prizeWinners = {};
    io.emit('game-started', { prizes: PRIZES });
    startAutoNumberCalling();
  });

  socket.on('reset-game', () => {
    if (socket.id !== hostId) return;

    if (numberInterval) {
      clearInterval(numberInterval);
      numberInterval = null;
    }

    gameStarted = false;
    calledNumbers = [];
    winnersCount = 0;
    prizeWinners = {};

    players.forEach(p => {
      p.winner = false;
      p.marked = [];
    });

    io.emit('game-reset');
    console.log("♻️ Game has been reset by host");
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    players = players.filter(p => p.id !== socket.id);
    if (socket.id === hostId) hostId = null;

    io.emit('players-list', players.map(p => ({
      name: p.name,
      ticketNumber: p.ticketNumber,
      ticket: p.ticket
    })));
  });
});

function startAutoNumberCalling() {
  numberInterval = setInterval(() => {
    if (winnersCount >= PRIZES.length || calledNumbers.length >= 90) {
      clearInterval(numberInterval);
      numberInterval = null;
      io.emit('game-ended');
      return;
    }

    let next;
    do {
      next = Math.floor(Math.random() * 90) + 1;
    } while (calledNumbers.includes(next));

    calledNumbers.push(next);
    io.emit('number-called', next);

    checkPrizes();
  }, 5000);
}

function checkPrizes() {
  players.forEach(p => {
    const flatNumbers = p.ticket.flat().filter(n => n !== null);

    // Quick Five
    if (!prizeWinners["Quick Five"]) {
      const matched = flatNumbers.filter(n => calledNumbers.includes(n));
      if (matched.length >= 5) {
        declareWinner("Quick Five", p);
      }
    }

    // First Line
    if (!prizeWinners["First Line"] && p.ticket[0].filter(n => n).every(num => calledNumbers.includes(num))) {
      declareWinner("First Line", p);
    }

    // Second Line
    if (!prizeWinners["Second Line"] && p.ticket[1].filter(n => n).every(num => calledNumbers.includes(num))) {
      declareWinner("Second Line", p);
    }

    // Third Line
    if (!prizeWinners["Third Line"] && p.ticket[2].filter(n => n).every(num => calledNumbers.includes(num))) {
      declareWinner("Third Line", p);
    }

    // Full Houses
    if (flatNumbers.every(num => calledNumbers.includes(num))) {
      const fullHouses = PRIZES.filter(pz => pz.includes("Full House") && !prizeWinners[pz]);
      if (fullHouses.length > 0) {
        declareWinner(fullHouses[0], p);
      }
    }
  });
}

function declareWinner(prize, player) {
  if (prizeWinners[prize]) return;
  prizeWinners[prize] = player;
  winnersCount++;
  io.emit('winner', { prize, name: player.name, ticketNumber: player.ticketNumber });
}

function generateTicket() {
  const ticket = Array.from({ length: 3 }, () => Array(9).fill(null));
  const columnRanges = [
    [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
    [50, 59], [60, 69], [70, 79], [80, 90]
  ];
  let usedNumbers = new Set();

  for (let row = 0; row < 3; row++) {
    let filled = 0;
    while (filled < 5) {
      const col = Math.floor(Math.random() * 9);
      if (ticket[row][col] !== null) continue;

      const [min, max] = columnRanges[col];
      let num;
      do {
        num = Math.floor(Math.random() * (max - min + 1)) + min;
      } while (usedNumbers.has(num));

      ticket[row][col] = num;
      usedNumbers.add(num);
      filled++;
    }
  }
  return ticket;
}

server.listen(3001, () => console.log('🚀 Server running on http://localhost:3001'));
