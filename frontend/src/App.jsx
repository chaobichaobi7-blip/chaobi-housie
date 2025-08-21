import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("https://your-backend-url.onrender.com"); // change to your backend URL

function App() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [takenTickets, setTakenTickets] = useState([]);
  const [myTicket, setMyTicket] = useState(null);

  useEffect(() => {
    socket.on("playersUpdate", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on("ticketsUpdate", (tickets) => {
      setTakenTickets(tickets);
    });

    socket.on("ticketError", (msg) => {
      alert(msg);
    });

    socket.on("gameReset", () => {
      setPlayers([]);
      setTakenTickets([]);
      setMyTicket(null);
      setHasJoined(false);
    });

    return () => {
      socket.off("playersUpdate");
      socket.off("ticketsUpdate");
      socket.off("ticketError");
      socket.off("gameReset");
    };
  }, []);

  const joinGame = () => {
    if (name.trim() === "") return alert("Enter your name");
    socket.emit("joinGame", { name, password });
    setHasJoined(true);
  };

  const selectTicket = (ticketNumber) => {
    socket.emit("selectTicket", ticketNumber);
    setMyTicket(ticketNumber);
  };

  const resetGame = () => {
    socket.emit("resetGame");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100">
      <header className="bg-yellow-400 w-full text-center py-6 shadow-md">
        <h1 className="text-3xl font-bold">CHAOBI HOUSIE</h1>
        <p className="text-lg">Chance to win ultimate prize</p>
      </header>

      {!hasJoined ? (
        <div className="mt-8 p-4 bg-white rounded-xl shadow-md">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 mr-2 rounded"
          />
          <input
            type="password"
            placeholder="Password (for host)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 mr-2 rounded"
          />
          <button
            onClick={joinGame}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Join Game
          </button>
        </div>
      ) : (
        <div className="mt-6 w-11/12 max-w-5xl">
          {/* Ticket selection */}
          {!myTicket && (
            <div>
              <h3 className="font-bold text-xl mb-2">Select Your Ticket (1–600)</h3>
              <div className="grid grid-cols-10 gap-2 max-h-[400px] overflow-y-scroll border p-2 rounded bg-white">
                {Array.from({ length: 600 }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => selectTicket(num)}
                    disabled={takenTickets.includes(num)}
                    className={`p-2 rounded text-sm ${
                      takenTickets.includes(num)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {myTicket && (
            <div className="mt-4 p-4 bg-green-100 rounded-xl shadow">
              <h3 className="font-bold text-lg">Your Ticket: {myTicket}</h3>
            </div>
          )}

          {/* Players list */}
          <div className="mt-6 bg-white p-4 rounded-xl shadow">
            <h3 className="font-bold text-xl mb-2">Players</h3>
            <ul>
              {players.map((p, idx) => (
                <li key={idx} className="py-1">
                  {p.name} {p.ticket && `(Ticket #${p.ticket})`}
                  {p.isHost && " 👑"}
                </li>
              ))}
            </ul>
          </div>

          {/* Reset button only for host */}
          {players.find((p) => p.name === name && p.isHost) && (
            <button
              onClick={resetGame}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Reset Game
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
