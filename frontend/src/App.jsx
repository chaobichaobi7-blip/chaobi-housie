import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import TicketsGrid from "./TicketsGrid";

const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000");

const App = () => {
  const [name, setName] = useState("");
  const [ticket, setTicket] = useState("");
  const [joined, setJoined] = useState(false);

  const joinGame = () => {
    if (!name || !ticket) return;
    socket.emit("joinGame", { name, ticket: Number(ticket) });
    setJoined(true);
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">CHAOBI HOUSIE</h1>

      {!joined ? (
        <div className="flex flex-col items-center gap-2">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded"
          />
          <select
            value={ticket}
            onChange={(e) => setTicket(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Select Ticket</option>
            {Array.from({ length: 600 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Ticket #{i + 1}
              </option>
            ))}
          </select>
          <button
            onClick={joinGame}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Join Game
          </button>
        </div>
      ) : (
        <TicketsGrid socket={socket} />
      )}
    </div>
  );
};

export default App;
