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

export const BOARD_POINTS = [0, 1, 2, 3, 4, 5].map(i => MARGIN + i * STEP);
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

/**
 * 🛡️ AUTO-VERIFICAÇÃO DE INTEGRIDADE
 */
function validateLoopMapIntegrity() {
  const errors: string[] = [];
  const keys = Object.keys(LOOP_MAP);

  if (keys.length !== 16) {
    errors.push(`Esperava 16 transições de loop (8 loops x 2 sentidos), encontrei ${keys.length}.`);
  }

  for (const key of keys) {
    const [xs, ys, dxs, dys] = key.split(',').map(Number);

    const isEdgeCell = xs === 0 || xs === 5 || ys === 0 || ys === 5;
    if (!isEdgeCell) {
      errors.push(`Transição "${key}" está numa célula INTERNA (${xs},${ys}) — loops só podem estar na borda!`);
    }

    const t = LOOP_MAP[key];
    const reverseKey = `${t.x},${t.y},${-t.dx},${-t.dy}`;
    const reverse = LOOP_MAP[reverseKey];
    if (!reverse) {
      errors.push(`Transição "${key}" -> (${t.x},${t.y}) não tem par reverso ("${reverseKey}" ausente).`);
    } else if (reverse.x !== xs || reverse.y !== ys) {
      errors.push(`Transição "${key}" e seu reverso "${reverseKey}" não formam um ciclo fechado consistente.`);
    }
  }

  if (errors.length > 0) {
    console.error('🚨 [Surakarta] Falha de integridade geométrica detectada:\n' + errors.join('\n'));
  }
}

if (process.env.NODE_ENV !== 'production') {
  validateLoopMapIntegrity();
}

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

/**
 * 🎯 FUNÇÃO ÚNICA DE RASTREAMENTO
 */
interface TracedStep {
  x: number;
  y: number;
  isLoopCrossing: boolean;
  arcSample?: (steps: number) => { x: number; y: number }[];
}

function traceRay(x: number, y: number, dx: number, dy: number, maxSteps = 50): TracedStep[] {
  const trace: TracedStep[] = [];
  let cx = x, cy = y, cdx = dx, cdy = dy;

  for (let i = 0; i < maxSteps; i++) {
    const next = getNextRayState(cx, cy, cdx, cdy);
    if (!next) break;

    const isLoopCrossing = (next.x !== cx + cdx) || (next.y !== cy + cdy);
    trace.push({ x: next.x, y: next.y, isLoopCrossing, arcSample: next.arcSample });

    cx = next.x; cy = next.y; cdx = next.dx; cdy = next.dy;
  }
  return trace;
}

export function generateLegalMoves(state: SurakartaState): SurakartaMove[] {
  const moves: SurakartaMove[] = [];
  const { board, turn } = state;
  const P = BOARD_POINTS;

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
              moves.push({ fromX: x, fromY: y, toX: nx, toY: ny, isCapture: false, hopPoints: [] });
            }
          }
        }
      }

      // 2. Movimentos de Captura — usa a MESMA trilha (traceRay)
      const orthogonalDirs = [ [0,-1], [0,1], [-1,0], [1,0] ];
      for (const [dx0, dy0] of orthogonalDirs) {
        const trace = traceRay(x, y, dx0, dy0);
        let loopsSoFar = 0;

        for (let i = 0; i < trace.length; i++) {
          const step = trace[i];
          if (step.isLoopCrossing) loopsSoFar++;

          const occupant = board[step.y][step.x];
          if (occupant === 0) continue; 

          if (occupant !== turn) {
            const landing = trace[i + 1]; 

            if (landing) {
              const totalLoops = loopsSoFar + (landing.isLoopCrossing ? 1 : 0);
              const landingEmpty = board[landing.y][landing.x] === 0;

              if (totalLoops > 0 && landingEmpty) {
                const before = i === 0 ? { x: P[x], y: P[y] } : { x: P[trace[i - 1].x], y: P[trace[i - 1].y] };
                const railPoints = [{ x: P[x], y: P[y] }];
                for (let k = 0; k < i; k++) {
                  if (trace[k].isLoopCrossing && trace[k].arcSample) {
                    railPoints.push(...trace[k].arcSample!(ARC_SAMPLE_STEPS));
                  } else {
                    railPoints.push({ x: P[trace[k].x], y: P[trace[k].y] });
                  }
                }

                const hopPoints: { x: number; y: number }[] = [
                  before,
                  { x: P[step.x], y: P[step.y] }, 
                ];
                if (landing.isLoopCrossing && landing.arcSample) {
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
                  capturedX: step.x,
                  capturedY: step.y,
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

  return moves;
}

export function applyMove(state: SurakartaState, move: SurakartaMove): SurakartaState {
  const board = state.board.map(row => [...row]);

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

// ──────────────────────────────────────────────────────────────
// 🔧 FERRAMENTAS DE DEBUG
// ──────────────────────────────────────────────────────────────

export function xyToNotation(x: number, y: number): string {
  const letters = 'abcdef';
  const letter = letters[5 - y];
  const number = x + 1;
  return `${letter}${number}`;
}

export function notationToXY(notation: string): { x: number; y: number } {
  const letter = notation[0].toLowerCase();
  const number = parseInt(notation.slice(1), 10);
  const y = 5 - 'abcdef'.indexOf(letter);
  const x = number - 1;
  return { x, y };
}

export function debugMovesFrom(state: SurakartaState, notation: string) {
  const { x, y } = notationToXY(notation);
  const piece = state.board[y]?.[x];
  const moves = generateLegalMoves(state).filter(m => m.fromX === x && m.fromY === y);

  const result = {
    origem: notation,
    coordenadaInterna: { x, y },
    peca: piece === 1 ? 'Preta' : piece === -1 ? 'Branca' : 'Vazia',
    movimentos: moves.map(m => ({
      destino: xyToNotation(m.toX, m.toY),
      tipo: m.isCapture ? 'CAPTURA' : 'normal',
      captura: m.isCapture ? xyToNotation(m.capturedX!, m.capturedY!) : null,
    })),
  };

  console.table(result.movimentos);
  return result;
}
