import { useEffect, useState } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("https://chaobi-housie.onrender.com");

function App() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [ticketNumber, setTicketNumber] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [playersList, setPlayersList] = useState([]);
  const [winners, setWinners] = useState([]);
  const [prizes, setPrizes] = useState([]);

  useEffect(() => {
    socket.on("ticket", setTicket);
    socket.on("ticket-number", setTicketNumber);
    socket.on("number-called", (num) => {
      setCalledNumbers((prev) => [...prev, num]);
      setCurrentNumber(num);
    });
    socket.on("update-board", ({ calledNumbers, currentNumber }) => {
      setCalledNumbers(calledNumbers);
      setCurrentNumber(currentNumber);
    });
    socket.on("game-started", (data) => {
      setCalledNumbers([]);
      setWinners([]);
      setPrizes(data.prizes);
      alert("🎯 Game Started!");
    });
    socket.on("game-reset", () => {
      setCalledNumbers([]);
      setWinners([]);
      setPlayersList([]);
      setHasJoined(false);
      setTicket(null);
      setTicketNumber(null);
      alert("♻️ Game Reset! Please rejoin.");
    });
    socket.on("players-list", setPlayersList);
    socket.on("winner", (data) => setWinners((prev) => [...prev, data]));
    socket.on("error-message", alert);

    return () => socket.off();
  }, []);

  const joinGame = () => {
    if (!name.trim()) return;
    socket.emit("join", { name, password });
    if (password === "admin123") setIsHost(true);
    setHasJoined(true);
  };

  const claimPrize = (prize) => {
    socket.emit("claim-prize", { prize });
  };

  return (
    <div className="App">
      <div className="header">
        <img src="/trophy.png" alt="trophy" className="trophy" />
        <h1>CHAOBI HOUSIE</h1>
        <p>Chance to win ultimate prize</p>
      </div>

      {!hasJoined && (
        <div className="join-box">
          <input
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password (Host only)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={joinGame}>Join Game</button>
        </div>
      )}

      {isHost && (
        <div className="host-controls">
          <button onClick={() => socket.emit("start-game")}>▶️ Start Game</button>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to reset the game?")) {
                socket.emit("reset-game");
              }
            }}
          >
            ♻️ Reset Game
          </button>
          <button onClick={() => socket.emit("call-number")}>
            🎲 Call Number
          </button>
        </div>
      )}

      {currentNumber && (
        <div className="current-number">🎲 Current Number: {currentNumber}</div>
      )}

      <div className="numbers-board">
        {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => (
          <div
            key={num}
            className={`board-cell ${
              calledNumbers.includes(num) ? "marked" : ""
            } ${currentNumber === num ? "current" : ""}`}
          >
            {num}
          </div>
        ))}
      </div>

      {ticket && (
        <div className="my-ticket">
          <h3>Your Ticket #{String(ticketNumber).padStart(3, "0")}</h3>
          {ticket.map((row, ri) => (
            <div key={ri} className="row">
              {row.map((num, ci) => (
                <div
                  key={ci}
                  className={`cell ${calledNumbers.includes(num) ? "marked" : ""}`}
                >
                  {num || ""}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {winners.length > 0 && (
        <div className="winners">
          <h3>🎉 Winners</h3>
          {winners.map((w, i) => (
            <div key={i}>
              🏅 {w.prize} → {w.name} (Ticket #
              {String(w.ticketNumber).padStart(3, "0")})
            </div>
          ))}
        </div>
      )}

      {prizes.length > 0 && (
        <div className="prizes">
          <h3>🏆 Prizes</h3>
          {prizes.map((pz, i) => {
            const won = winners.find((w) => w.prize === pz);
            return (
              <div key={i} className={won ? "won" : "pending"}>
                {pz}{" "}
                {won ? `✅ Won by ${won.name}` : (
                  <button onClick={() => claimPrize(pz)}>Claim</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;
