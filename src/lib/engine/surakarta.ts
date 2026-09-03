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
const P = [15, 29, 43, 57, 71, 85];

function getNextRayState(x: number, y: number, dx: number, dy: number): { x: number, y: number, dx: number, dy: number, arc?: string } | null {
  const key = `${x},${y},${dx},${dy}`;
  
  const loops: Record<string, {x:number, y:number, dx:number, dy:number, arc: string}> = {
    // TL
    "0,1,-1,0": { x: 1, y: 0, dx: 0, dy: 1, arc: "A 14 14 0 1 1 29 15" },
    "1,0,0,-1": { x: 0, y: 1, dx: 1, dy: 0, arc: "A 14 14 0 1 0 15 29" },
    "0,2,-1,0": { x: 2, y: 0, dx: 0, dy: 1, arc: "A 28 28 0 1 1 43 15" },
    "2,0,0,-1": { x: 0, y: 2, dx: 1, dy: 0, arc: "A 28 28 0 1 0 15 43" },

    // TR
    "5,1,1,0":  { x: 4, y: 0, dx: 0, dy: 1, arc: "A 14 14 0 1 0 71 15" },
    "4,0,0,-1": { x: 5, y: 1, dx: -1, dy: 0, arc: "A 14 14 0 1 1 85 29" },
    "5,2,1,0":  { x: 3, y: 0, dx: 0, dy: 1, arc: "A 28 28 0 1 0 57 15" },
    "3,0,0,-1": { x: 5, y: 2, dx: -1, dy: 0, arc: "A 28 28 0 1 1 85 43" },

    // BL
    "0,4,-1,0": { x: 1, y: 5, dx: 0, dy: -1, arc: "A 14 14 0 1 0 29 85" },
    "1,5,0,1":  { x: 0, y: 4, dx: 1, dy: 0, arc: "A 14 14 0 1 1 15 71" },
    "0,3,-1,0": { x: 2, y: 5, dx: 0, dy: -1, arc: "A 28 28 0 1 0 43 85" },
    "2,5,0,1":  { x: 0, y: 3, dx: 1, dy: 0, arc: "A 28 28 0 1 1 15 57" },

    // BR
    "5,4,1,0":  { x: 4, y: 5, dx: 0, dy: -1, arc: "A 14 14 0 1 1 71 85" },
    "4,5,0,1":  { x: 5, y: 4, dx: -1, dy: 0, arc: "A 14 14 0 1 0 85 71" },
    "5,3,1,0":  { x: 3, y: 5, dx: 0, dy: -1, arc: "A 28 28 0 1 1 57 85" },
    "3,5,0,1":  { x: 5, y: 3, dx: -1, dy: 0, arc: "A 28 28 0 1 0 85 57" },
  };

  if (loops[key]) return loops[key];

  const nx = x + dx;
  const ny = y + dy;
  if (nx >= 0 && nx <= 5 && ny >= 0 && ny <= 5) {
    return { x: nx, y: ny, dx, dy };
  }
  
  return null;
}

export function generateLegalMoves(state: SurakartaState): SurakartaMove[] {
  const moves: SurakartaMove[] = [];
  const { board, turn } = state;

  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
      if (board[y][x] !== turn) continue;

      // 1. Normal Moves
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

      // 2. Capturing Moves
      const orthogonalDirs = [ [0,-1], [0,1], [-1,0], [1,0] ];
      for (const [startDx, startDy] of orthogonalDirs) {
        let currX = x;
        let currY = y;
        let dx = startDx;
        let dy = startDy;
        let loopsTraversed = 0;
        let steps = 0;
        
        let path = `M ${P[x]} ${P[y]}`;

        while (steps < 50) {
          const nextState = getNextRayState(currX, currY, dx, dy);
          if (!nextState) break;

          const isLoop = (nextState.x !== currX + dx) || (nextState.y !== currY + dy);
          if (isLoop) {
            loopsTraversed++;
            if (nextState.arc) {
              path += ` ${nextState.arc}`;
            }
          } else {
            path += ` L ${P[nextState.x]} ${P[nextState.y]}`;
          }
          
          currX = nextState.x;
          currY = nextState.y;
          dx = nextState.dx;
          dy = nextState.dy;
          steps++;

          if (board[currY][currX] !== 0) {
            if (board[currY][currX] !== turn && loopsTraversed > 0) {
              moves.push({ fromX: x, fromY: y, toX: currX, toY: currY, isCapture: true, path });
            }
            break;
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
