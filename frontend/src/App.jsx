import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

// 🔗 Point this to your deployed backend or local server
const socket = io("https://chaobi-housie.onrender.com");


function App() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [ticketCount, setTicketCount] = useState(1);
  const [useBook, setUseBook] = useState(false);

  const [hasJoined, setHasJoined] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [ticketNumbers, setTicketNumbers] = useState([]);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [playersList, setPlayersList] = useState([]);
  const [winners, setWinners] = useState([]);
  const [prizes, setPrizes] = useState([]);

  useEffect(() => {
    socket.on('tickets', ({ tickets, ticketNumbers }) => {
      setTickets(tickets);
      setTicketNumbers(ticketNumbers);
    });

    socket.on('called-numbers', (nums) => {
      setCalledNumbers(nums || []);
    });

    socket.on('number-called', (num) => {
      setCalledNumbers(prev => prev.includes(num) ? prev : [...prev, num]);
      // (optional) sound per call
      // new Audio(`/sounds/${num}.mp3`).play().catch(()=>{});
    });

    socket.on('game-started', data => {
      setCalledNumbers([]);
      setWinners([]);
      setPrizes(data.prizes || []);
      alert('🎯 Game Started!');
    });

    socket.on('game-reset', () => {
      alert('♻️ Game has been reset. Please rejoin.');
      window.location.reload();
    });

    socket.on('game-ended', () => alert('🏁 Game Ended!'));

    socket.on('players-list', setPlayersList);

    socket.on('winner', (data) => {
      // data = { prize, winners:[{name, ticketNumber}] }
      setWinners(prev => [...prev, data]);
    });

    socket.on('error-message', (msg) => alert(msg));

    return () => {
      socket.off();
    };
  }, []);

  const joinGame = () => {
    if (!name.trim()) return;
    socket.emit('join', { name, password, ticketCount, useBook });
    if (password === 'admin123') setIsHost(true);
    setHasJoined(true);
  };

  const currentNumber = calledNumbers[calledNumbers.length - 1];

  return (
    <div className="App">
      {/* HEADER */}
      <div className="header">
        <img src="/trophy.png" alt="trophy" className="trophy" />
        <h1>CHAOBI HOUSIE</h1>
        <p>Chance to win ultimate prize</p>
      </div>

      {/* JOIN FORM */}
      {!hasJoined && (
        <div className="join-box">
          <input
            placeholder="Your Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password (Host only)"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <label className="inline">
            🎟️ How many tickets?
            <select value={ticketCount} onChange={e => setTicketCount(Number(e.target.value))}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="inline">
            <input type="checkbox" checked={useBook} onChange={e => setUseBook(e.target.checked)} />
            Use 6-Ticket Book mode
          </label>
          <button onClick={joinGame}>Join Game</button>
        </div>
      )}

      {/* HOST CONTROLS */}
      {isHost && (
        <div className="host-controls">
          <button onClick={() => socket.emit('start-game')} className="start-btn">
            ▶️ Start Game
          </button>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to reset the game? Everyone will be kicked out.")) {
                socket.emit('reset-game');
              }
            }}
            className="reset-btn"
          >
            ♻️ Reset Game
          </button>
        </div>
      )}

      {/* CURRENT NUMBER + DASHBOARD */}
      <div className="dashboard">
        <h3>🎲 Numbers Called</h3>
        <div className="latest">
          Current Number: <span>{currentNumber ?? '-'}</span>
        </div>
        <div className="numbers-grid">
          {Array.from({ length: 90 }, (_, i) => i + 1).map(num => (
            <div key={num} className={`num-cell ${calledNumbers.includes(num) ? 'called' : ''}`}>
              {num}
            </div>
          ))}
        </div>
      </div>

      {/* MY TICKETS */}
      {hasJoined && tickets.length > 0 && (
        <div className="my-tickets">
          <h3>My Tickets</h3>
          {tickets.map((tkt, ti) => (
            <div className="ticket" key={ti}>
              <h5>Ticket #{String(ticketNumbers[ti]).padStart(3, '0')}</h5>
              {tkt.map((row, ri) => (
                <div key={ri} className="row">
                  {row.map((num, ci) => (
                    <div key={ci} className={`cell ${num && calledNumbers.includes(num) ? 'marked' : ''}`}>
                      {num || ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ALL PLAYERS LIST (everyone can see all tickets, like your original) */}
      {playersList.length > 0 && (
        <div className="player-list">
          <h3>Players Joined:</h3>
          {playersList.map((p, i) => (
            <div key={i} className="player">
              <strong>{p.name}</strong>{" "}
              ({p.ticketNumbers.map(tn => `#${String(tn).padStart(3,'0')}`).join(', ')})
              {p.tickets.map((tkt, ti) => (
                <div key={ti} className="ticket">
                  <h5>Ticket #{String(p.ticketNumbers[ti]).padStart(3,'0')}</h5>
                  {tkt.map((row, ri) => (
                    <div key={ri} className="row">
                      {row.map((num, ci) => (
                        <div key={ci} className={`cell ${num && calledNumbers.includes(num) ? 'marked' : ''}`}>
                          {num || ''}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* WINNERS */}
      {winners.length > 0 && (
        <div className="winners">
          <h3>🎉 Winners</h3>
          {winners.map((w, i) => (
            <div key={i} className="winner-line">
              🏅 {w.prize} →
              {w.winners.map((win, wi) => (
                <span key={wi}>
                  {" "}{win.name} (Ticket #{String(win.ticketNumber).padStart(3, '0')}}{wi < w.winners.length - 1 ? "," : ""})
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* PRIZES LIST */}
      {prizes.length > 0 && (
        <div className="prizes">
          <h3>🏆 Prizes</h3>
          {prizes.map((pz, i) => {
            const won = winners.find(w => w.prize === pz);
            return (
              <div key={i} className={`prize-item ${won ? 'won' : 'pending'}`}>
                {pz} {won ? `✅ Won` : '⏳ Yet to be won'}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;
