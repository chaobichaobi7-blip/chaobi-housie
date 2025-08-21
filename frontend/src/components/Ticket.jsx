function Tickets({ players }) {
  return (
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
  );
}

export default Tickets;
