// Generate a random housie ticket (3x9, 15 numbers total)
export function generateTicket() {
  // 9 columns, each representing a number range
  const ranges = [
    [1, 9],
    [10, 19],
    [20, 29],
    [30, 39],
    [40, 49],
    [50, 59],
    [60, 69],
    [70, 79],
    [80, 90],
  ];

  // Pick numbers from each column
  const cols = ranges.map(([min, max]) => {
    const count = Math.floor(Math.random() * 2); // 0,1,2 numbers per col
    const numbers = [];
    for (let i = 0; i < count; i++) {
      numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return numbers.sort((a, b) => a - b);
  });

  // Flatten & pick exactly 15 numbers
  let allNumbers = cols.flat();
  while (allNumbers.length > 15) {
    allNumbers.splice(Math.floor(Math.random() * allNumbers.length), 1);
  }

  // Prepare 3 rows × 9 cols grid
  const grid = Array.from({ length: 3 }, () => Array(9).fill(""));

  let row = 0;
  allNumbers.forEach((num) => {
    const col = ranges.findIndex(([min, max]) => num >= min && num <= max);
    while (grid[row][col] !== "") {
      row = (row + 1) % 3;
    }
    grid[row][col] = num;
  });

  return grid;
}
