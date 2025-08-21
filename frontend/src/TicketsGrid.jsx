// frontend/src/TicketsGrid.jsx
import React from "react";

const TicketsGrid = ({ tickets }) => {
  return (
    <div className="grid grid-cols-10 gap-2 p-4">
      {tickets.map((ticket, index) => (
        <div
          key={index}
          className="border rounded p-2 text-center bg-white shadow"
        >
          <div className="font-bold">{ticket.name}</div>
          <div className="text-sm text-gray-500">#{ticket.id}</div>
        </div>
      ))}
    </div>
  );
};

export default TicketsGrid;
