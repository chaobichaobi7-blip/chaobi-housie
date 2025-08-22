// App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

/* -------------------- Deterministic Tambola Ticket Generator -------------------- */

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

  const colValues = cols.map((pool, c) =>
    pickN(pool, colCounts[c], r).sort((a, b) => a - b)
  );

  const rows = [[], [], []];
  const rowCounts = [0, 0, 0];
  function pickRows(k) {
    const order = [0, 1, 2].sort(
      (a, b) => rowCounts[a] - rowCounts[b] || r() - 0.5
    );
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

/* ------------------- Ticket Card ------------------- */

const TicketCard = ({ ticketNumber, layout, name, isMine, canBook, onBook, faded }) => (
  <div
    onClick={() => canBook && onBook(ticketNumber)}
    style={{
      border: "1px solid #999",
      borderRadius: 10,
      background: isMine ? "#c8f7c5" : name ? "#f8c5c5" : faded ? "#eee" : "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      cursor: canBook ? "pointer" : "default",
      padding: 8,
      width: 240,
      userSelect: "none",
      transition: "transform 120ms",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <div style={{ fontWeight: 700 }}>#{ticketNumber}</div>
      <div style={{ fontSize: 12, fontWeight: 600, opacity: name ? 1 : 0.35 }}>
        {name || "Available"}
      </div>
    </div>

    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
        fontSize: 12,
        textAlign: "center",
      }}
    >
      <tbody>
        {layout.map((row, rIdx) => (
          <tr key={rIdx}>
            {row.map((num, cIdx) => (
              <td
                key={cIdx}
                style={{
                  border: "1px solid #ccc",
                  height: 22,
                  verticalAlign: "middle",
                  background: num ? "transparent" : "rgba(0,0,0,0.03)",
                }}
              >
                {num ?? ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ------------------- App ------------------- */

export default function App() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [myTicket, setMyTicket] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [password, setPassword] = useState("");
  const [gameStarted, setGameStarted] = useState(false);

  const API_BASE = "https://chaobi-housie.onrender.com";

  // Precompute tickets once
  const layouts = useMemo(() => {
    const map = new Map();
    for (let i = 1; i <= 600; i++) map.set(i, genTicket(i));
    return map;
  }, []);

  useEffect(() => {
    const socket = io(API_BASE, { transports: ["websocket"] });

    socket.on("playerJoined", player => {
      setPlayers(prev => {
        const exists = prev.some(p => p.ticketNumber === player.ticketNumber);
        const next = exists
          ? prev.map(p => (p.ticketNumber === player.ticketNumber ? player : p))
          : [...prev, player];
        return next;
      });
    });

    socket.on("gameReset", () => {
      setPlayers([]);
      setMyTicket(null);
      setGameStarted(false);
      alert("Game has been reset");
    });

    socket.on("gameStarted", () => setGameStarted(true));

    // initial fetch
    (async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          fetch(`${API_BASE}/players`),
          fetch(`${API_BASE}/state`),
        ]);
        const pData = await pRes.json();
        setPlayers(pData || []);
        const sData = await sRes.json();
        setGameStarted(!!sData?.gameStarted);
      } catch (e) {
        console.error("Initial load error:", e);
      }
    })();

    return () => socket.disconnect();
  }, []);

  const bookable = ticketNumber =>
    !gameStarted && !players.some(p => p.ticketNumber === ticketNumber);

  const joinGame = async ticketNumber => {
    if (!name.trim()) return alert("Enter your name first!");
    try {
      const res = await fetch(`${API_BASE}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ticket: `Ticket #${ticketNumber}` }),
      });
      const data = await res.json();
      if (data.success) {
        setMyTicket(ticketNumber);
        setPlayers(prev => {
          const next = prev.filter(p => p.ticketNumber !== ticketNumber);
          return [...next, { name, ticketNumber, ticketData: layouts.get(ticketNumber) }];
        });
      } else alert(data.error || "Failed to join");
    } catch (err) {
      console.error("Join error:", err);
      alert("Error joining game");
    }
  };

  const loginHost = async () => {
    try {
      const res = await fetch(`${API_BASE}/host-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) setIsHost(true);
      else alert("Invalid host password");
    } catch (err) {
      console.error("Host login error:", err);
    }
  };

  const resetGame = async () => fetch(`${API_BASE}/reset`, { method: "POST" });
  const startGame = async () => fetch(`${API_BASE}/start`, { method: "POST" });

  const playerByTicket = ticketNumber => players.find(p => p.ticketNumber === ticketNumber);

  return (
    <div style={{ textAlign: "center", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>CHAOBI HOUSIE</h1>

      {!isHost && (
        <div style={{ marginBottom: 16, opacity: gameStarted ? 0.7 : 1 }}>
          <input
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ padding: 8, width: 260, borderRadius: 8, border: "1px solid #ccc" }}
            disabled={gameStarted}
          />
        </div>
      )}

      {!isHost ? (
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Host password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ padding: 8, width: 220, borderRadius: 8, border: "1px solid #ccc", marginRight: 8 }}
          />
          <button onClick={loginHost} style={{ padding: "8px 14px", borderRadius: 8 }}>
            Login as Host
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <button onClick={startGame} style={{ padding: "8px 14px", borderRadius: 8, marginRight: 8 }}>
            Start Game
          </button>
          <button onClick={resetGame} style={{ padding: "8px 14px", borderRadius: 8 }}>
            Reset Game
          </button>
          <div style={{ marginTop: 8, fontSize: 12 }}>Booked: {players.length} / 600</div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {Array.from({ length: 600 }, (_, i) => {
          const ticketNumber = i + 1;
          const bookedBy = playerByTicket(ticketNumber);
          return (
            <TicketCard
              key={ticketNumber}
              ticketNumber={ticketNumber}
              layout={layouts.get(ticketNumber)}
              name={bookedBy?.name || ""}
              isMine={myTicket === ticketNumber}
              canBook={bookable(ticketNumber)}
              onBook={joinGame}
              faded={gameStarted && !bookedBy}
            />
          );
        })}
      </div>

      <div style={{ margin: "16px 0", fontSize: 12, opacity: 0.7 }}>
        Legend:{" "}
        <span style={{ background:"#fff", padding:"2px 6px", border:"1px solid #ccc", borderRadius:6 }}>Available</span>{" "}
        <span style={{ background:"#f8c5c5", padding:"2px 6px", border:"1px solid #ccc", borderRadius:6 }}>Booked</span>{" "}
        <span style={{ background:"#c8f7c5", padding:"2px 6px", border:"1px solid #ccc", borderRadius:6 }}>Your Ticket</span>{" "}
        <span style={{ background:"#eee", padding:"2px 6px", border:"1px solid #ccc", borderRadius:6 }}>Disabled after Start</span>
      </div>
    </div>
  );
}
