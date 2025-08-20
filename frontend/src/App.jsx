import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3001');

function App() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [ticketNumber, setTicketNumber] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [playersList, setPlayersList] = useState([]);
  const [winners, setWinners] = useState([]);
  const [prizes, setPrizes] = useState([]);

  useEffect(() => {
    socket.on('ticket', setTicket);
    socket.on('ticket-number', setTicketNumber);
    socket.on('number-called', num => {
      setCalledNumbers(prev => [...prev, num]);

      // Play sound
      const audio = new Audio(`/sounds/${num}.mp3`);
      audio.play().catch(() => {});
    });
    socket.on('game-started', data => {
      setCalledNumbers([]);
      setWinners([]);
      setPrizes(data.prizes);
      alert('🎯 Game Started!');
    });
    socket.on('game-reset', () => {
      setCalledNumbers([]);
      setWinners([]);
      alert('♻️ Game Reset! Waiting for host to start.');
    });
    socket.on('game-ended', () => alert('🏁 Game Ended!'));
    socket.on('players-list', setPlayersList);
    socket.on('winner', data => setWinners(prev => [...prev, data]));
    socket.on('error-message', alert);

    return () => {
      socket.off();
    };
  }, []);

  const joinGame = () => {
    if (!name.trim()) return;
    socket.emit('join', { name, password });
    if (password === 'admin123') setIsHost(true);
    setHasJoined(true);
  };

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
          <input placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
          <input type="password" placeholder="Password (Host only)" value={password} onChange={e => setPassword(e.target.value)} />
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
              if (window.confirm("Are you sure you want to reset the game?")) {
                socket.emit('reset-game');
              }
            }}
            className="reset-btn"
          >
            ♻️ Reset Game
          </button>
        </div>
      )}

      {/* ALL PLAYERS LIST */}
      {playersList.length > 0 && (
        <div className="player-list">
          <h3>Players Joined:</h3>
          {playersList.map((p, i) => (
            <div key={i} className="player-ticket">
              <strong>{p.name}</strong> (Ticket #{String(p.ticketNumber).padStart(3, '0')})
              <div className="ticket">
                {p.ticket.map((row, ri) => (
                  <div key={ri} className="row">
                    {row.map((num, ci) => (
                      <div key={ci} className={`cell ${calledNumbers.includes(num) ? 'marked' : ''}`}>
                        {num || ''}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WINNERS */}
      {winners.length > 0 && (
        <div className="winners">
          <h3>🎉 Winners</h3>
          {winners.map((w, i) => (
            <div key={i}>
              🏅 {w.prize} → {w.name} (Ticket #{String(w.ticketNumber).padStart(3, '0')})
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
              <div key={i} className={won ? 'won' : 'pending'}>
                {pz} {won ? `✅ Won by ${won.name}` : '⏳ Yet to be won'}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;
