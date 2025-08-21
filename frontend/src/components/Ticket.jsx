import "./Tickets.css";

function Tickets({ players }) {
  // Create a quick lookup map for assigned tickets
  const ticketMap = {};
  players.forEach((p) => {
    ticketMap[p.ticket] = p.name;
  });

  return (
    <div style={{ marginTop: "30px" }}>
      <h2>All Tickets (1–600)</h2>
      <div className="tickets-grid">
        {Array.from({ length: 600 }, (_, i) => {
          const ticketNumber = `Ticket #${i + 1}`;
          const playerName = ticketMap[ticketNumber];
          return (
            <div
              key={i}
              className={`ticket ${playerName ? "taken" : ""}`}
            >
              <span>{ticketNumber}</span>
              {playerName && (
                <div className="player-name">{playerName}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Tickets;
