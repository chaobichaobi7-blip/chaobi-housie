import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { generateTicket } from "./utils/ticketGenerator";
import Ticket from "./components/Ticket";

const socket = io("http://localhost:5000");

export default function App() {
  const [name, setName] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [ticketGrid, setTicketGrid] = useState(null);
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [hostPassword, setHostPassword] = useState("");

  useEffect(() => {
    socket.on("updatePlayers", (data) => {
      setPlayers(data);
    });

    socket.on("numberCalled", (num) => {
      setCalledNumbers((prev) => [...prev, num]);
    });

    return () => {
      socket.off("updatePlayers");
      socket.off("numberCalled");
    };
  }, []);

  const joinGame = () => {
    if (!name || !ticketNumber) return;
    const grid = generateTicket();
    setTicketGrid(grid);
    socket.emit("joinGame", { name, ticketNumber });
    setJoined(true);
  };

  const loginHost = () => {
    if (hostPassword === "chaobi123") {
      setIsHost(true);
      setJoined(true);
    } else {
      alert("Wrong host password!");
    }
  };

  const callNumber = () => {
    let num;
    do {
      num = Math.floor(Math.random() * 90) + 1;
    } while (calledNumbers.includes(num));

    socket.emit("callNumber", num);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>CHAOBI HOUSIE</h1>

      {!joined && (
        <div>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
          >
            <option value="">Select Ticket</option>
            {[...Array(600)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Ticket #{i + 1}
              </option>
            ))}
          </select>
          <button onClick={joinGame}>Join Game</button>

          <br /><br />

          <input
            type="password"
            placeholder="Host password"
            value={hostPassword}
            onChange={(e) => setHostPassword(e.target.value)}
          />
          <button onClick={loginHost}>Login as Host</button>
        </div>
      )}

      {joined && !isHost && (
        <div>
          <h2>Welcome, {name}!</h2>
          <p>Your Ticket #{ticketNumber}</p>

          {ticketGrid && <Ticket grid={ticketGrid} calledNumbers={calledNumbers} />}

          <h3>Numbers Called:</h3>
          <p>{calledNumbers.join(", ") || "No numbers yet"}</p>
        </div>
      )}

      {joined && isHost && (
        <div>
          <h2>Host Panel</h2>
          <button onClick={callNumber}>Call Number</button>

          <h3>Numbers Called:</h3>
          <p>{calledNumbers.join(", ") || "No numbers yet"}</p>

          <h3>Players:</h3>
          <ul>
            {players.map((p) => (
              <li key={p.id}>
                {p.name} (Ticket #{p.ticketNumber})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
