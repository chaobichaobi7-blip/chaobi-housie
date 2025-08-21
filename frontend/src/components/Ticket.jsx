import React from "react";

export default function Ticket({ grid, calledNumbers }) {
  return (
    <div style={{ display: "inline-block", margin: "10px" }}>
      <table
        style={{
          borderCollapse: "collapse",
          margin: "auto",
          fontSize: "18px",
        }}
      >
        <tbody>
          {grid.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((num, cIdx) => (
                <td
                  key={cIdx}
                  style={{
                    border: "1px solid black",
                    width: "40px",
                    height: "40px",
                    textAlign: "center",
                    backgroundColor: calledNumbers.includes(num)
                      ? "lightgreen"
                      : "white",
                  }}
                >
                  {num || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
