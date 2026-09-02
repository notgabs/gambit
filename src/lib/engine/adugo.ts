import { AdugoBoard, AdugoMove, AdugoState } from '@/types/adugo';

/**
 * Tabuleiro exato do Adugo (Fiel à imagem):
 * Malha 5x5 com diagonais alternadas (padrão diamante).
 * Toca inferior forma um triângulo perfeito conectado apenas ao nó 22.
 */

export const LINES: [number, number][] = [
  // Grid 5x5 - Horizontais
  [0, 1], [1, 2], [2, 3], [3, 4],
  [5, 6], [6, 7], [7, 8], [8, 9],
  [10, 11], [11, 12], [12, 13], [13, 14],
  [15, 16], [16, 17], [17, 18], [18, 19],
  [20, 21], [21, 22], [22, 23], [23, 24],

  // Grid 5x5 - Verticais
  [0, 5], [5, 10], [10, 15], [15, 20],
  [1, 6], [6, 11], [11, 16], [16, 21],
  [2, 7], [7, 12], [12, 17], [17, 22],
  [3, 8], [8, 13], [13, 18], [18, 23],
  [4, 9], [9, 14], [14, 19], [19, 24],

  // Grid 5x5 - Diagonais \ (apenas nós onde r+c é par)
  [0, 6], [2, 8], [6, 12], [8, 14], [10, 16], [12, 18], [16, 22], [18, 24],

  // Grid 5x5 - Diagonais / (apenas nós onde r+c é par)
  [2, 6], [4, 8], [6, 10], [8, 12], [12, 16], [14, 18], [16, 20], [18, 22],

  // Toca (Triângulo perfeito a partir do nó 22)
  [22, 25], [22, 26], [22, 27],
  [25, 26], [26, 27],
  [25, 28], [26, 29], [27, 30],
  [28, 29], [29, 30]
];

// Retas com 3+ pontos (para validação de PULO em linha)
const FULL_LINES: number[][] = [
  // Horizontais
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
  [25, 26, 27], [28, 29, 30],

  // Verticais
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22, 26, 29], // Eixo central cruza a toca
  [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],

  // Diagonais \
  [0, 6, 12, 18, 24], [2, 8, 14], [10, 16, 22],
  
  // Diagonais /
  [4, 8, 12, 16, 20], [2, 6, 10], [14, 18, 22],

  // Retas da Toca (Bordas laterais do triângulo)
  [22, 25, 28], // Lado esquerdo
  [22, 27, 30]  // Lado direito
];

export const ADJ: Record<number, number[]> = {};
for (let i = 0; i < 31; i++) ADJ[i] = [];
for (const [a, b] of LINES) {
  if (!ADJ[a].includes(b)) ADJ[a].push(b);
  if (!ADJ[b].includes(a)) ADJ[b].push(a);
}

export function isStraightLine(a: number, b: number, c: number): boolean {
  for (const line of FULL_LINES) {
    const ia = line.indexOf(a);
    const ib = line.indexOf(b);
    const ic = line.indexOf(c);
    if (ia < 0 || ib < 0 || ic < 0) continue;
    // Pulo válido se os 3 nós são consecutivos em alguma reta
    if ((ia + 1 === ib && ib + 1 === ic) || (ia - 1 === ib && ib - 1 === ic)) {
      return true;
    }
  }
  return false;
}

function getValidJumps(from: number, board: AdugoBoard): AdugoMove[] {
  const moves: AdugoMove[] = [];
  for (const victim of ADJ[from]) {
    if (board[victim] !== -1) continue; // Onça só captura cães
    for (const dest of ADJ[victim]) {
      if (dest === from || board[dest] !== 0) continue; // Destino deve ser vazio
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

    // Passos simples
    for (const dest of ADJ[i]) {
      if (board[dest] === 0) moves.push({ from: i, to: dest });
    }

    // Pulos (capturas) exclusivas da Onça
    if (turn === 1) {
      moves.push(...getValidJumps(i, board));
    }
  }
  return moves;
}

export function newAdugoGame(): AdugoState {
  const board: AdugoBoard = Array(31).fill(0);
  
  // Onça no centro
  board[12] = 1;
  
  // 14 Cães
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14].forEach((p) => {
    board[p] = -1;
  });

  const state: AdugoState = {
    board,
    turn: 1, // Onça começa
    winner: null,
    dogsCaptured: 0,
    legalMoves: [],
    history: [board.join('')],
    rules: { maxCapturesToWin: 5 },
  };
  
  state.legalMoves = generateLegalMoves(state);
  return state;
}

export function applyMove(state: AdugoState, move: AdugoMove): AdugoState {
  const board = [...state.board];
  board[move.to] = board[move.from];
  board[move.from] = 0;

  let dogsCaptured = state.dogsCaptured;
  if (move.capture !== undefined) {
    board[move.capture] = 0;
    dogsCaptured += 1;
  }

  let winner: 1 | -1 | 0 | null = null;
  if (dogsCaptured >= state.rules.maxCapturesToWin) winner = 1;

  const nextTurn: 1 | -1 = state.turn === 1 ? -1 : 1;
  const boardKey = board.join('');
  const newHistory = [...(state.history || []), boardKey];

  const next: AdugoState = {
    ...state,
    board,
    turn: nextTurn,
    dogsCaptured,
    winner,
    history: newHistory,
    legalMoves: [],
  };

  if (winner === null) {
    const legal = generateLegalMoves(next);
    if (legal.length === 0) {
      next.winner = nextTurn === 1 ? -1 : 1; // Quem não tem movimentos perde
    } else {
      next.legalMoves = legal;
    }
  }
  
  return next;
}
