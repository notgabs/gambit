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

/**
 * Coordenadas dos nós do tabuleiro em % da viewBox (0-100).
 * Margem de 20 em cada borda + espaçamento de 12 entre linhas.
 * Isso garante que o loop grande (raio 24) nunca "estoure" para
 * coordenadas negativas nos cantos (o bug do círculo cortado).
 *
 * ⚠️ Única fonte de verdade — importe isso no componente, não duplique.
 */
export const BOARD_POINTS = [20, 32, 44, 56, 68, 80];

// Simulador de Ray Tracing para os loops
function getNextRayState(x: number, y: number, dx: number, dy: number): { x: number, y: number, dx: number, dy: number, arc?: string } | null {
  const key = `${x},${y},${dx},${dy}`;

  const loops: Record<string, {x:number, y:number, dx:number, dy:number, arc: string}> = {
    // TL
    "0,1,-1,0": { x: 1, y: 0, dx: 0, dy: 1, arc: "A 12 12 0 1 1 32 20" },
    "1,0,0,-1": { x: 0, y: 1, dx: 1, dy: 0, arc: "A 12 12 0 1 0 20 32" },
    "0,2,-1,0": { x: 2, y: 0, dx: 0, dy: 1, arc: "A 24 24 0 1 1 44 20" },
    "2,0,0,-1": { x: 0, y: 2, dx: 1, dy: 0, arc: "A 24 24 0 1 0 20 44" },

    // TR
    "5,1,1,0":  { x: 4, y: 0, dx: 0, dy: 1, arc: "A 12 12 0 1 0 68 20" },
    "4,0,0,-1": { x: 5, y: 1, dx: -1, dy: 0, arc: "A 12 12 0 1 1 80 32" },
    "5,2,1,0":  { x: 3, y: 0, dx: 0, dy: 1, arc: "A 24 24 0 1 0 56 20" },
    "3,0,0,-1": { x: 5, y: 2, dx: -1, dy: 0, arc: "A 24 24 0 1 1 80 44" },

    // BL
    "0,4,-1,0": { x: 1, y: 5, dx: 0, dy: -1, arc: "A 12 12 0 1 0 32 80" },
    "1,5,0,1":  { x: 0, y: 4, dx: 1, dy: 0, arc: "A 12 12 0 1 1 20 68" },
    "0,3,-1,0": { x: 2, y: 5, dx: 0, dy: -1, arc: "A 24 24 0 1 0 44 80" },
    "2,5,0,1":  { x: 0, y: 3, dx: 1, dy: 0, arc: "A 24 24 0 1 1 20 56" },

    // BR
    "5,4,1,0":  { x: 4, y: 5, dx: 0, dy: -1, arc: "A 12 12 0 1 1 68 80" },
    "4,5,0,1":  { x: 5, y: 4, dx: -1, dy: 0, arc: "A 12 12 0 1 0 80 68" },
    "5,3,1,0":  { x: 3, y: 5, dx: 0, dy: -1, arc: "A 24 24 0 1 1 56 80" },
    "3,5,0,1":  { x: 5, y: 3, dx: -1, dy: 0, arc: "A 24 24 0 1 0 80 56" },
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

      // 1. Movimentos Normais
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

      // 2. Movimentos de Captura
      const orthogonalDirs = [ [0,-1], [0,1], [-1,0], [1,0] ];
      for (const [startDx, startDy] of orthogonalDirs) {
        let currX = x;
        let currY = y;
        let dx = startDx;
        let dy = startDy;
        let loopsTraversed = 0;
        let steps = 0;

        // Cada passo do "raio" vira um waypoint, com seu próprio
        // trecho de path. Isso permite separar depois o trajeto
        // (rail) do salto final.
        const waypoints: { x: number; y: number; segment: string }[] = [];

        while (steps < 50) {
          const nextState = getNextRayState(currX, currY, dx, dy);
          if (!nextState) break;

          const isLoop = (nextState.x !== currX + dx) || (nextState.y !== currY + dy);
          if (isLoop) loopsTraversed++;

          const segment = isLoop && nextState.arc
            ? ` ${nextState.arc}`
            : ` L ${BOARD_POINTS[nextState.x]} ${BOARD_POINTS[nextState.y]}`;

          waypoints.push({ x: nextState.x, y: nextState.y, segment });

          currX = nextState.x;
          currY = nextState.y;
          dx = nextState.dx;
          dy = nextState.dy;
          steps++;

          if (board[currY][currX] !== 0) {
            if (board[currY][currX] !== turn && loopsTraversed > 0) {
              const lastWaypoint = waypoints[waypoints.length - 1];
              const lastIsStraight = lastWaypoint.segment.trim().startsWith('L');

              // Se o último passo é reto, ele vira o "salto" e sai do rail.
              // Se o último passo é a saída de um loop, mantemos ele no rail
              // (sem salto), pra não cortar reto por cima do tabuleiro.
              const railWaypoints = lastIsStraight ? waypoints.slice(0, -1) : waypoints;

              const railPath = `M ${BOARD_POINTS[x]} ${BOARD_POINTS[y]}` +
                railWaypoints.map(w => w.segment).join('');

              const pre = railWaypoints.length > 0
                ? railWaypoints[railWaypoints.length - 1]
                : { x, y };

              moves.push({
                fromX: x,
                fromY: y,
                toX: currX,
                toY: currY,
                isCapture: true,
                railPath,
                railSteps: railWaypoints.length,
                preCaptureX: lastIsStraight ? pre.x : currX,
                preCaptureY: lastIsStraight ? pre.y : currY,
                hasFinalHop: lastIsStraight,
              });
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
