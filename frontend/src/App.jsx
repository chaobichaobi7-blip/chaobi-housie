import React, { useState, useEffect } from "react";
import TicketsGrid from "./TicketsGrid";

const App = () => {
  const [name, setName] = useState("");
  const [ticket, setTicket] = useState("");
  const [password, setPassword] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [joined, setJoined] = useState(false);
  const [tickets, setTickets] = useState([]);

  // Fetch all tickets from backend
  useEffect(() => {
    fetch("https://your-backend-url.onrender.com/tickets")
      .then((res) => res.json())
      .then((data) => setTickets(data))
      .catch((err) => console.error("Error fetching tickets:", err));
  }, []);

  const handleJoin = () => {
    if (!name || !ticket) {
      alert("Please enter name and select a ticket!");
      return;
    }

    // Send join request to backend
    fetch("https://your-backend-url.onrender.com/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ticket }),
    })
      .then((res) => res.json())
      .then(() => {
        setJoined(true);
      })
      .catch((err) => console.error("Join error:", err));
  };

  const handleHostLogin = () => {
    if (password === "host123") {
      setIsHost(true);
      setJoined(true);
    } else {
      alert("Wrong host password!");
    }
  };

  if (!joined) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>CHAOBI HOUSIE</h1>

        {/* Player join */}
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={ticket} onChange={(e) => setTicket(e.target.value)}>
          <option value="">Select Ticket</option>
          {Array.from({ length: 600 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Ticket #{i + 1}
            </option>
          ))}
        </select>
        <button onClick={handleJoin}>Join Game</button>

        <br />
        <br />

        {/* Host login */}
        <input
          type="password"
          placeholder="Host password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleHostLogin}>Login as Host</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>All Tickets</h2>
      <TicketsGrid tickets={tickets} />
    </div>
  );
};

export default App;
