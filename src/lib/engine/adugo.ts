import { AdugoBoard, AdugoMove, AdugoState } from '@/types/adugo';

export const COORDS = [
  // Grid 5x5
  { x: 10, y: 10 }, { x: 30, y: 10 }, { x: 50, y: 10 }, { x: 70, y: 10 }, { x: 90, y: 10 },
  { x: 10, y: 30 }, { x: 30, y: 30 }, { x: 50, y: 30 }, { x: 70, y: 30 }, { x: 90, y: 30 },
  { x: 10, y: 50 }, { x: 30, y: 50 }, { x: 50, y: 50 }, { x: 70, y: 50 }, { x: 90, y: 50 },
  { x: 10, y: 70 }, { x: 30, y: 70 }, { x: 50, y: 70 }, { x: 70, y: 70 }, { x: 90, y: 70 },
  { x: 10, y: 90 }, { x: 30, y: 90 }, { x: 50, y: 90 }, { x: 70, y: 90 }, { x: 90, y: 90 },
  // Toca
  { x: 30, y: 110 }, { x: 50, y: 110 }, { x: 70, y: 110 },
  { x: 10, y: 130 }, { x: 50, y: 130 }, { x: 90, y: 130 },
];

export const LINES: [number, number][] = [
  // Horizontais 5x5
  [0, 1], [1, 2], [2, 3], [3, 4],
  [5, 6], [6, 7], [7, 8], [8, 9],
  [10, 11], [11, 12], [12, 13], [13, 14],
  [15, 16], [16, 17], [17, 18], [18, 19],
  [20, 21], [21, 22], [22, 23], [23, 24],
  // Verticais 5x5
  [0, 5], [5, 10], [10, 15], [15, 20],
  [1, 6], [6, 11], [11, 16], [16, 21],
  [2, 7], [7, 12], [12, 17], [17, 22],
  [3, 8], [8, 13], [13, 18], [18, 23],
  [4, 9], [9, 14], [14, 19], [19, 24],
  // Diagonais 5x5 (nós pares)
  [0, 6], [2, 8], [6, 12], [8, 14], [10, 16], [12, 18], [16, 22], [18, 24],
  [2, 6], [4, 8], [6, 10], [8, 12], [12, 16], [14, 18], [16, 20], [18, 22],
  // Toca
  [22, 25], [22, 26], [22, 27],
  [25, 26], [26, 27],
  [25, 28], [26, 29], [27, 30],
  [28, 29], [29, 30]
];

export const ADJ: Record<number, number[]> = {};
for (let i = 0; i < 31; i++) ADJ[i] = [];
for (const [a, b] of LINES) {
  if (!ADJ[a].includes(b)) ADJ[a].push(b);
  if (!ADJ[b].includes(a)) ADJ[b].push(a);
}

// Derivar retas para capturas usando matemática vetorial
export function areColinearAndSequential(a: number, b: number, c: number): boolean {
  const pA = COORDS[a], pB = COORDS[b], pC = COORDS[c];
  const cross = (pB.x - pA.x) * (pC.y - pB.y) - (pB.y - pA.y) * (pC.x - pB.x);
  if (Math.abs(cross) > 0.001) return false;
  const dot = (pB.x - pA.x) * (pC.x - pB.x) + (pB.y - pA.y) * (pC.y - pB.y);
  return dot > 0;
}

export function isStraightLine(a: number, b: number, c: number): boolean {
  if (!ADJ[a].includes(b) || !ADJ[b].includes(c)) return false;
  return areColinearAndSequential(a, b, c);
}

function getValidJumps(from: number, board: AdugoBoard): AdugoMove[] {
  const moves: AdugoMove[] = [];
  for (const victim of ADJ[from]) {
    if (board[victim] !== -1) continue; 
    for (const dest of ADJ[victim]) {
      if (dest === from || board[dest] !== 0) continue; 
      if (isStraightLine(from, victim, dest)) {
        moves.push({ from, to: dest, capture: victim });
      }
    }
  }
  return moves;
}

export function generateLegalMoves(state: AdugoState): AdugoMove[] {
  const moves: AdugoMove[] = [];
  const { board, turn } = state;

  for (let i = 0; i < 31; i++) {
    if (board[i] !== turn) continue;
    for (const dest of ADJ[i]) {
      if (board[dest] === 0) moves.push({ from: i, to: dest });
    }
    if (turn === 1) moves.push(...getValidJumps(i, board));
  }
  return moves;
}

export function newAdugoGame(): AdugoState {
  const board: AdugoBoard = Array(31).fill(0);
  board[12] = 1;
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14].forEach(p => board[p] = -1);

  const state: AdugoState = {
    board,
    turn: 1,
    winner: null,
    dogsCaptured: 0,
    legalMoves: [],
    history: [board.join('')],
    rules: { maxCapturesToWin: 5, drawAfterRepetitions: 3, drawAfterPliesWithoutCapture: 60 },
    pliesPlayed: 0,
    pliesWithoutCapture: 0,
  };
  state.legalMoves = generateLegalMoves(state);
  return state;
}

export function applyMove(state: AdugoState, move: AdugoMove): AdugoState {
  const board = [...state.board];
  board[move.to] = board[move.from];
  board[move.from] = 0;

  let dogsCaptured = state.dogsCaptured;
  let pliesWithoutCapture = state.pliesWithoutCapture + 1;
  
  if (move.capture !== undefined) {
    board[move.capture] = 0;
    dogsCaptured += 1;
    pliesWithoutCapture = 0;
  }

  let winner: 1 | -1 | 0 | null = null;
  if (dogsCaptured >= state.rules.maxCapturesToWin) winner = 1;

  const boardKey = board.join('');
  const newHistory = [...state.history, boardKey];

  const occurrences = newHistory.filter(h => h === boardKey).length;
  if (occurrences >= state.rules.drawAfterRepetitions) winner = 0;
  
  if (pliesWithoutCapture >= state.rules.drawAfterPliesWithoutCapture) winner = 0;

  const nextTurn: 1 | -1 = state.turn === 1 ? -1 : 1;
  const next: AdugoState = {
    ...state,
    board,
    turn: nextTurn,
    dogsCaptured,
    winner,
    history: newHistory,
    legalMoves: [],
    pliesPlayed: state.pliesPlayed + 1,
    pliesWithoutCapture,
    lastMove: move,
  };

  if (winner === null) {
    const legal = generateLegalMoves(next);
    if (legal.length === 0) {
      next.winner = nextTurn === 1 ? -1 : 1;
    } else {
      next.legalMoves = legal;
    }
  }
  return next;
}
