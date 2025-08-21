import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Ticket from "./components/Ticket.jsx";


function App() {
  const [name, setName] = useState("");
  const [ticket, setTicket] = useState("Ticket #1");
  const [password, setPassword] = useState("");
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);

  const API_BASE = "https://your-backend-url.onrender.com";

  // 🔗 Connect socket
  useEffect(() => {
    const socket = io(API_BASE);

    // Listen for new players
    socket.on("playerJoined", (player) => {
      setPlayers((prev) => [...prev, player]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Join as player
  const joinGame = async () => {
    try {
      const res = await fetch(`${API_BASE}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ticket }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Joined game successfully!");
      } else {
        alert(data.error || "Failed to join");
      }
    } catch (err) {
      console.error("Join error:", err);
      alert("Error joining game");
    }
  };

  // Host login
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
        fetchPlayers();
      } else {
        alert("Invalid host password");
      }
    } catch (err) {
      console.error("Host login error:", err);
    }
  };

  // Get all players (initial fetch for host)
  const fetchPlayers = async () => {
    try {
      const res = await fetch(`${API_BASE}/players`);
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      console.error("Fetch players error:", err);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>CHAOBI HOUSIE</h1>

      {/* Player Join */}
      <div>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={ticket} onChange={(e) => setTicket(e.target.value)}>
          {Array.from({ length: 600 }, (_, i) => (
            <option key={i}>Ticket #{i + 1}</option>
          ))}
        </select>
        <button onClick={joinGame}>Join Game</button>
      </div>

      {/* Host Login */}
      <div style={{ marginTop: "20px" }}>
        <input
          placeholder="Host password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={loginHost}>Login as Host</button>
      </div>

      {/* Host View */}
      {isHost && (
        <div style={{ marginTop: "30px" }}>
          <h2>Players Joined</h2>
          <ul>
            {players.map((p, idx) => (
              <li key={idx}>
                {p.name} ({p.ticket})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
