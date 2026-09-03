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

const MARGIN = 25;
const STEP = 10;

export const BOARD_POINTS = [0, 1, 2, 3, 4, 5].map(i => MARGIN + i * STEP); // [25,35,45,55,65,75]
export const LOOP_RADIUS_SMALL = STEP;
export const LOOP_RADIUS_LARGE = STEP * 2;

const ARC_SAMPLE_STEPS = 10;

interface ArcInfo {
  svg: string;
  sample: (steps: number) => { x: number; y: number }[];
}

function computeArc(cx: number, cy: number, r: number, x0: number, y0: number, x1: number, y1: number): ArcInfo {
  const TWO_PI = Math.PI * 2;
  let a0 = Math.atan2(y0 - cy, x0 - cx);
  let a1 = Math.atan2(y1 - cy, x1 - cx);
  a0 = (a0 + TWO_PI) % TWO_PI;
  a1 = (a1 + TWO_PI) % TWO_PI;

  let diff = a1 - a0;
  while (diff > Math.PI) diff -= TWO_PI;
  while (diff <= -Math.PI) diff += TWO_PI;
  const longDiff = diff > 0 ? diff - TWO_PI : diff + TWO_PI;
  const sweepFlag = longDiff > 0 ? 1 : 0;

  return {
    svg: `A ${r} ${r} 0 1 ${sweepFlag} ${x1} ${y1}`,
    sample: (steps: number) => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const angle = a0 + longDiff * t;
        pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
      }
      return pts;
    },
  };
}

interface RayTransition {
  x: number; y: number; dx: number; dy: number;
  arcSvg: string;
  arcSample: (steps: number) => { x: number; y: number }[];
}

function buildLoopMap(): Record<string, RayTransition> {
  const P = BOARD_POINTS;
  const map: Record<string, RayTransition> = {};

  const pair = (
    keyA: string, nextA: Omit<RayTransition, 'arcSvg' | 'arcSample'>,
    keyB: string, nextB: Omit<RayTransition, 'arcSvg' | 'arcSample'>,
    cx: number, cy: number, r: number,
    ax: number, ay: number, bx: number, by: number
  ) => {
    const ab = computeArc(cx, cy, r, ax, ay, bx, by);
    const ba = computeArc(cx, cy, r, bx, by, ax, ay);
    map[keyA] = { ...nextA, arcSvg: ab.svg, arcSample: ab.sample };
    map[keyB] = { ...nextB, arcSvg: ba.svg, arcSample: ba.sample };
  };

  const S = LOOP_RADIUS_SMALL;
  const L = LOOP_RADIUS_LARGE;

  pair("0,1,-1,0", { x: 1, y: 0, dx: 0, dy: 1 }, "1,0,0,-1", { x: 0, y: 1, dx: 1, dy: 0 },
    P[0], P[0], S, P[0], P[1], P[1], P[0]);
  pair("0,2,-1,0", { x: 2, y: 0, dx: 0, dy: 1 }, "2,0,0,-1", { x: 0, y: 2, dx: 1, dy: 0 },
    P[0], P[0], L, P[0], P[2], P[2], P[0]);

  pair("5,1,1,0", { x: 4, y: 0, dx: 0, dy: 1 }, "4,0,0,-1", { x: 5, y: 1, dx: -1, dy: 0 },
    P[5], P[0], S, P[5], P[1], P[4], P[0]);
  pair("5,2,1,0", { x: 3, y: 0, dx: 0, dy: 1 }, "3,0,0,-1", { x: 5, y: 2, dx: -1, dy: 0 },
    P[5], P[0], L, P[5], P[2], P[3], P[0]);

  pair("0,4,-1,0", { x: 1, y: 5, dx: 0, dy: -1 }, "1,5,0,1", { x: 0, y: 4, dx: 1, dy: 0 },
    P[0], P[5], S, P[0], P[4], P[1], P[5]);
  pair("0,3,-1,0", { x: 2, y: 5, dx: 0, dy: -1 }, "2,5,0,1", { x: 0, y: 3, dx: 1, dy: 0 },
    P[0], P[5], L, P[0], P[3], P[2], P[5]);

  pair("5,4,1,0", { x: 4, y: 5, dx: 0, dy: -1 }, "4,5,0,1", { x: 5, y: 4, dx: -1, dy: 0 },
    P[5], P[5], S, P[5], P[4], P[4], P[5]);
  pair("5,3,1,0", { x: 3, y: 5, dx: 0, dy: -1 }, "3,5,0,1", { x: 5, y: 3, dx: -1, dy: 0 },
    P[5], P[5], L, P[5], P[3], P[3], P[5]);

  return map;
}

const LOOP_MAP = buildLoopMap();

interface NextRayResult {
  x: number; y: number; dx: number; dy: number;
  arcSample?: (steps: number) => { x: number; y: number }[];
}

function getNextRayState(x: number, y: number, dx: number, dy: number): NextRayResult | null {
  const key = `${x},${y},${dx},${dy}`;
  const t = LOOP_MAP[key];
  if (t) return t;

  const nx = x + dx;
  const ny = y + dy;
  if (nx >= 0 && nx <= 5 && ny >= 0 && ny <= 5) {
    return { x: nx, y: ny, dx, dy };
  }
  return null;
}

export interface DecorativeLoop {
  path: string;
  size: 'small' | 'large';
}

export function getDecorativeLoops(): DecorativeLoop[] {
  const P = BOARD_POINTS;
  const S = LOOP_RADIUS_SMALL;
  const L = LOOP_RADIUS_LARGE;

  const arc = (cx: number, cy: number, r: number, x0: number, y0: number, x1: number, y1: number) => {
    const a = computeArc(cx, cy, r, x0, y0, x1, y1);
    return `M ${x0} ${y0} ${a.svg}`;
  };

  return [
    { path: arc(P[0], P[0], S, P[0], P[1], P[1], P[0]), size: 'small' },
    { path: arc(P[0], P[0], L, P[0], P[2], P[2], P[0]), size: 'large' },
    { path: arc(P[5], P[0], S, P[5], P[1], P[4], P[0]), size: 'small' },
    { path: arc(P[5], P[0], L, P[5], P[2], P[3], P[0]), size: 'large' },
    { path: arc(P[0], P[5], S, P[0], P[4], P[1], P[5]), size: 'small' },
    { path: arc(P[0], P[5], L, P[0], P[3], P[2], P[5]), size: 'large' },
    { path: arc(P[5], P[5], S, P[5], P[4], P[4], P[5]), size: 'small' },
    { path: arc(P[5], P[5], L, P[5], P[3], P[3], P[5]), size: 'large' },
  ];
}

export function generateLegalMoves(state: SurakartaState): SurakartaMove[] {
  const moves: SurakartaMove[] = [];
  const { board, turn } = state;
  const P = BOARD_POINTS;

  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
      if (board[y][x] !== turn) continue;

      // 1. Movimentos Normais — 1 casa, 8 direções, só se vazia
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx <= 5 && ny >= 0 && ny <= 5) {
            if (board[ny][nx] === 0) {
              moves.push({ fromX: x, fromY: y, toX: nx, toY: ny, isCapture: false, hopPoints: [] });
            }
          }
        }
      }

      // 2. Movimentos de Captura (estilo dama: salta a peça capturada e pousa 1 casa depois)
      const orthogonalDirs = [ [0,-1], [0,1], [-1,0], [1,0] ];
      for (const [startDx, startDy] of orthogonalDirs) {
        let currX = x;
        let currY = y;
        let dx = startDx;
        let dy = startDy;
        let loopsTraversed = 0;
        let steps = 0;

        const points: { x: number; y: number }[] = [{ x: P[x], y: P[y] }];

        while (steps < 50) {
          const next = getNextRayState(currX, currY, dx, dy);
          if (!next) break;

          const isLoop = (next.x !== currX + dx) || (next.y !== currY + dy);
          if (isLoop && next.arcSample) {
            loopsTraversed++;
            points.push(...next.arcSample(ARC_SAMPLE_STEPS));
          } else {
            points.push({ x: P[next.x], y: P[next.y] });
          }

          currX = next.x;
          currY = next.y;
          dx = next.dx;
          dy = next.dy;
          steps++;

          if (board[currY][currX] !== 0) {
            if (board[currY][currX] !== turn) {
              const landing = getNextRayState(currX, currY, dx, dy);

              if (landing) {
                const landingIsLoop = (landing.x !== currX + dx) || (landing.y !== currY + dy);
                const totalLoops = loopsTraversed + (landingIsLoop ? 1 : 0);

                if (totalLoops > 0 && board[landing.y][landing.x] === 0) {
                  const railPoints = points.slice(0, -1);
                  const capturedPointPct = points[points.length - 1];

                  const hopPoints: { x: number; y: number }[] = [
                    railPoints.length > 0 ? railPoints[railPoints.length - 1] : { x: P[x], y: P[y] },
                    capturedPointPct,
                  ];

                  if (landingIsLoop && landing.arcSample) {
                    hopPoints.push(...landing.arcSample(ARC_SAMPLE_STEPS));
                  } else {
                    hopPoints.push({ x: P[landing.x], y: P[landing.y] });
                  }

                  moves.push({
                    fromX: x,
                    fromY: y,
                    toX: landing.x,
                    toY: landing.y,
                    isCapture: true,
                    slidePoints: railPoints.length > 1 ? railPoints : undefined,
                    capturedX: currX,
                    capturedY: currY,
                    hopPoints,
                  });
                }
              }
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

  // ⚠️ Importante: agora 'to' NÃO é mais a casa da peça capturada,
  // então ela precisa ser removida explicitamente daqui.
  if (move.isCapture && move.capturedX !== undefined && move.capturedY !== undefined) {
    board[move.capturedY][move.capturedX] = 0;
  }

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

  let newState: SurakartaState = {
    ...state,
    board,
    turn: nextTurn,
    winner,
    history: newHistory,
    pliesWithoutCapture
  };

  if (newState.winner === null) {
    const nextMoves = generateLegalMoves(newState);
    if (nextMoves.length === 0) {
      newState.winner = nextTurn === 1 ? -1 : 1;
    }
  }

  return newState;
}
