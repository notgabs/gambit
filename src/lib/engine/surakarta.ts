import type { SurakartaPiece, SurakartaMove, SurakartaState } from '@/types/surakarta';

export function newSurakartaGame(): SurakartaState {
  const board: SurakartaPiece[][] = [
    [ 1,  1,  1,  1,  1,  1],
    [ 1,  1,  1,  1,  1,  1],
    [ 0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
  ];

  return {
    board,
    turn: 1,
    winner: null,
    history: [JSON.stringify(board) + '1'],
    pliesWithoutCapture: 0
  };
}

// Ray mapping for when a piece leaves the 6x6 grid.
// Key: "x,y,dx,dy" where (x,y) is the point ON the grid, and (dx,dy) is the direction pointing OUT of the grid.
// Value: the new coordinate and direction after traversing the loop.
function getNextRayState(x: number, y: number, dx: number, dy: number): { x: number, y: number, dx: number, dy: number } | null {
  const key = `${x},${y},${dx},${dy}`;
  
  const loops: Record<string, {x:number, y:number, dx:number, dy:number}> = {
    // Outer Top-Left (Row 1 / Col 1)
    "0,1,-1,0": { x: 1, y: 0, dx: 0, dy: 1 },
    "1,0,0,-1": { x: 0, y: 1, dx: 1, dy: 0 },
    // Outer Bottom-Left (Row 4 / Col 1)
    "0,4,-1,0": { x: 1, y: 5, dx: 0, dy: -1 },
    "1,5,0,1":  { x: 0, y: 4, dx: 1, dy: 0 },
    // Outer Top-Right (Row 1 / Col 4)
    "5,1,1,0":  { x: 4, y: 0, dx: 0, dy: 1 },
    "4,0,0,-1": { x: 5, y: 1, dx: -1, dy: 0 },
    // Outer Bottom-Right (Row 4 / Col 4)
    "5,4,1,0":  { x: 4, y: 5, dx: 0, dy: -1 },
    "4,5,0,1":  { x: 5, y: 4, dx: -1, dy: 0 },
    
    // Inner Top-Left (Row 2 / Col 2)
    "0,2,-1,0": { x: 2, y: 0, dx: 0, dy: 1 },
    "2,0,0,-1": { x: 0, y: 2, dx: 1, dy: 0 },
    // Inner Bottom-Left (Row 3 / Col 2)
    "0,3,-1,0": { x: 2, y: 5, dx: 0, dy: -1 },
    "2,5,0,1":  { x: 0, y: 3, dx: 1, dy: 0 },
    // Inner Top-Right (Row 2 / Col 3)
    "5,2,1,0":  { x: 3, y: 0, dx: 0, dy: 1 },
    "3,0,0,-1": { x: 5, y: 2, dx: -1, dy: 0 },
    // Inner Bottom-Right (Row 3 / Col 3)
    "5,3,1,0":  { x: 3, y: 5, dx: 0, dy: -1 },
    "3,5,0,1":  { x: 5, y: 3, dx: -1, dy: 0 },
  };

  if (loops[key]) return loops[key];

  // Continue in grid
  const nx = x + dx;
  const ny = y + dy;
  if (nx >= 0 && nx <= 5 && ny >= 0 && ny <= 5) {
    return { x: nx, y: ny, dx, dy };
  }
  
  return null; // Hit a wall (rows 0/5 or cols 0/5)
}

export function generateLegalMoves(state: SurakartaState): SurakartaMove[] {
  const moves: SurakartaMove[] = [];
  const { board, turn } = state;

  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
      if (board[y][x] !== turn) continue;

      // 1. Normal Moves (Orthogonal and Diagonal)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx <= 5 && ny >= 0 && ny <= 5) {
            if (board[ny][nx] === 0) {
              moves.push({ fromX: x, fromY: y, toX: nx, toY: ny, isCapture: false });
            }
          }
        }
      }

      // 2. Capturing Moves (Orthogonal ONLY, requires loops)
      const orthogonalDirs = [ [0,-1], [0,1], [-1,0], [1,0] ];
      for (const [startDx, startDy] of orthogonalDirs) {
        let currX = x;
        let currY = y;
        let dx = startDx;
        let dy = startDy;
        let loopsTraversed = 0;
        let steps = 0;

        while (steps < 50) { // arbitrary limit to prevent infinite loops (theoretical empty board orbit)
          const nextState = getNextRayState(currX, currY, dx, dy);
          if (!nextState) break; // Ray died on a wall

          const isLoop = (nextState.x !== currX + dx) || (nextState.y !== currY + dy);
          if (isLoop) loopsTraversed++;
          
          currX = nextState.x;
          currY = nextState.y;
          dx = nextState.dx;
          dy = nextState.dy;
          steps++;

          if (board[currY][currX] !== 0) {
            // Hit a piece!
            if (board[currY][currX] !== turn && loopsTraversed > 0) {
              // Hit an enemy AND traversed at least one loop
              moves.push({ fromX: x, fromY: y, toX: currX, toY: currY, isCapture: true });
            }
            break; // Stop ray tracing, can't jump over pieces
          }
        }
      }
    }
  }

  return moves;
}

export function applyMove(state: SurakartaState, move: SurakartaMove): SurakartaState {
  const board = state.board.map(row => [...row]);
  
  board[move.toY][move.toX] = board[move.fromY][move.fromX];
  board[move.fromY][move.fromX] = 0;

  let p1Count = 0;
  let p2Count = 0;
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
      if (board[y][x] === 1) p1Count++;
      if (board[y][x] === -1) p2Count++;
    }
  }

  let winner: 1 | -1 | 0 | null = null;
  if (p1Count === 0) winner = -1;
  else if (p2Count === 0) winner = 1;

  const nextTurn = state.turn === 1 ? -1 : 1;
  const pliesWithoutCapture = move.isCapture ? 0 : state.pliesWithoutCapture + 1;
  
  const historyKey = JSON.stringify(board) + nextTurn;
  const newHistory = [...state.history, historyKey];
  
  // Draws
  if (newHistory.filter(h => h === historyKey).length >= 3) winner = 0;
  if (pliesWithoutCapture >= 60) winner = 0;

  return {
    ...state,
    board,
    turn: nextTurn,
    winner,
    history: newHistory,
    pliesWithoutCapture
  };
}
