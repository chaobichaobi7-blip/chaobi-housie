// A single ticket with 3 rows × 9 cols
function Ticket({ numbers }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(9, 40px)",
      gap: "5px",
      margin: "20px auto",
      width: "max-content",
      border: "2px solid black",
      padding: "10px"
    }}>
      {numbers.map((row, rowIdx) =>
        row.map((num, colIdx) => (
          <div key={`${rowIdx}-${colIdx}`}
            style={{
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid gray",
              background: num ? "white" : "#f0f0f0"
            }}
          >
            {num || ""}
          </div>
        ))
      )}
    </div>
  );
}

export default Ticket;
