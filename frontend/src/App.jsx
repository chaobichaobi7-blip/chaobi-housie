import { useState, useEffect } from "react";
import { io } from "socket.io-client";

function App() {
  const [players, setPlayers] = useState([]);
  const [bookedTickets, setBookedTickets] = useState([]);
  const [name, setName] = useState("");
  const [myTicket, setMyTicket] = useState(null);

  const [isHost, setIsHost] = useState(false);
  const [password, setPassword] = useState("");
  const [gameStarted, setGameStarted] = useState(false);

  const API_BASE = "https://chaobi-housie.onrender.com";

  useEffect(() => {
    const socket = io(API_BASE);

    socket.on("playerJoined", (player) => {
      setPlayers((prev) => [...prev, player]);
      setBookedTickets((prev) => [...prev, player.ticketNumber]);
    });

    socket.on("gameReset", () => {
      setPlayers([]);
      setBookedTickets([]);
      setMyTicket(null);
      setGameStarted(false);
      alert("Game has been reset!");
    });

    socket.on("gameStarted", () => {
      setGameStarted(true);
      alert("Game started!");
    });

    fetchPlayers();

    return () => socket.disconnect();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch(`${API_BASE}/players`);
      const data = await res.json();
      setPlayers(data);
      setBookedTickets(data.map((p) => p.ticketNumber));
    } catch (err) {
      console.error("Fetch players error:", err);
    }
  };

  const joinGame = async (ticketNumber) => {
    if (!name.trim()) {
      alert("Enter your name first!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ticket: `Ticket #${ticketNumber}` }),
      });

      const data = await res.json();
      if (data.success) {
        setMyTicket(ticketNumber);
        setBookedTickets((prev) => [...prev, ticketNumber]);
        alert(`You booked Ticket #${ticketNumber}`);
      } else {
        alert(data.error || "Failed to join");
      }
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
      if (data.success) {
        setIsHost(true);
      } else {
        alert("Invalid host password");
      }
    } catch (err) {
      console.error("Host login error:", err);
    }
  };

  const resetGame = async () => {
    try {
      await fetch(`${API_BASE}/reset`, { method: "POST" });
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  const startGame = async () => {
    try {
      await fetch(`${API_BASE}/start`, { method: "POST" });
    } catch (err) {
      console.error("Start error:", err);
    }
  };

  // 🔹 Render all tickets
  const renderTicketGrid = () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(20, 1fr)", // 20 per row
        gap: "5px",
        maxWidth: "95%",
        margin: "auto",
      }}
    >
      {Array.from({ length: 600 }, (_, i) => {
        const ticketNum = i + 1;
        const player = players.find((p) => p.ticketNumber === ticketNum);
        const isBooked = !!player;
        const isMine = myTicket === ticketNum;

        const canBook = !gameStarted && !isBooked;

        return (
          <button
            key={ticketNum}
            onClick={() => canBook && joinGame(ticketNum)}
            disabled={!canBook}
            style={{
              padding: "6px",
              fontSize: "11px",
              backgroundColor: isMine
                ? "lightgreen"
                : isBooked
                ? "lightcoral"
                : gameStarted
                ? "#ddd" // grey for unbooked tickets once game started
                : "white",
              border: "1px solid #444",
              borderRadius: "6px",
              minHeight: "45px",
              cursor: canBook ? "pointer" : "not-allowed",
            }}
          >
            <div style={{ fontWeight: "bold" }}>#{ticketNum}</div>
            <div style={{ fontSize: "10px" }}>
              {player ? player.name : ""}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h1>CHAOBI HOUSIE</h1>

      {/* Name input for players (before game starts) */}
      {!isHost && !gameStarted && (
        <div style={{ marginBottom: "20px" }}>
          <input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}

      {/* All players & host see the ticket grid */}
      {renderTicketGrid()}

      {/* Host Login */}
      {!isHost && (
        <div style={{ marginTop: "20px" }}>
          <input
            placeholder="Host password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={loginHost}>Login as Host</button>
        </div>
      )}

      {/* Host Controls */}
      {isHost && (
        <div style={{ marginTop: "30px" }}>
          <h2>Host Controls</h2>
          <button
            onClick={startGame}
            style={{
              padding: "10px 20px",
              marginRight: "10px",
              backgroundColor: "lightgreen",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Start Game
          </button>
          <button
            onClick={resetGame}
            style={{
              padding: "10px 20px",
              backgroundColor: "orange",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Reset Game
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
