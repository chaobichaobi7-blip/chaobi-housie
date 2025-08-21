function JoinForm({ name, setName, ticket, setTicket, joinGame }) {
  return (
    <div>
      <input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select value={ticket} onChange={(e) => setTicket(e.target.value)}>
        {Array.from({ length: 600 }, (_, i) => (
          <option key={i}>Ticket #{i + 1}</option>
        ))}
      </select>
      <button onClick={joinGame}>Join Game</button>
    </div>
  );
}

export default JoinForm;
