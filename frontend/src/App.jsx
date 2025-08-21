import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import JoinForm from "./components/JoinForm";
import HostLogin from "./components/HostLogin";
import Ticket from "./components/Ticket";

function App() {
  const [name, setName] = useState("");
  const [ticket, setTicket] = useState("Ticket #1");
  const [password, setPassword] = useState("");
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [ticketNumbers, setTicketNumbers] = useState(null);

  const API_BASE = "https://chaobi-housie.onrender.com";

  useEffect(() => {
    const socket = io(API_BASE);

    socket.on("playerJoined", (player) => {
      setPlayers((prev) => [...prev, player]);
    });

    fetchPlayers();

    return () => socket.disconnect();
  }, []);

  const joinGame = async () => {
  try {
    const res = await fetch(`${API_BASE}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ticket }),
    });

    const data = await res.json();
    if (data.success) {
      setTicketNumbers(data.ticketData); // 🎟️ save full ticket
      alert("Joined game successfully!");
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
        fetchPlayers();
      } else {
        alert("Invalid host password");
      }
    } catch (err) {
      console.error("Host login error:", err);
    }
  };

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
      <JoinForm
        name={name}
        setName={setName}
        ticket={ticket}
        setTicket={setTicket}
        joinGame={joinGame}
      />

      {/* Host Login */}
      <HostLogin
        password={password}
        setPassword={setPassword}
        loginHost={loginHost}
      />

      {/* ✅ Player list (visible to everyone) */}
      <Tickets players={players} />
    </div>
  );
}

export default App;
