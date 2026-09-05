import type {
  SurakartaPiece,
  SurakartaMove,
  SurakartaState,
  SurakartaPlayer,
  SurakartaEndReason,
  XY,
} from '@/types/surakarta';

// ─────────────────────────────────────────────────────────────
// Regras configuráveis
// ─────────────────────────────────────────────────────────────

export type CaptureMode = 'standard' | 'hop';

/**
 * 'standard' — regra oficial: a atacante percorre o circuito, passa por ≥1 loop
 *              e POUSA NA CASA da peça capturada (substituição).
 * 'hop'      — variante estilo damas: salta por cima e pousa na casa seguinte,
 *              que precisa estar livre.
 * Em ambos os modos a casa de origem é tratada como vazia durante o trajeto.
 */
export const CAPTURE_MODE = 'standard' as CaptureMode;

/** Lances consecutivos sem captura que resultam em empate. */
export const DRAW_PLIES = 60;

// ─────────────────────────────────────────────────────────────
// Geometria do tabuleiro (% da viewBox 100x100)
// ─────────────────────────────────────────────────────────────

const N = 6;
const CELLS = N * N;
const MARGIN = 25;
const STEP = 10;
const ARC_SAMPLE_STEPS = 10;

export const BOARD_POINTS = [0, 1, 2, 3, 4, 5].map(i => MARGIN + i * STEP);
export const LOOP_RADIUS_SMALL = STEP;
export const LOOP_RADIUS_LARGE = STEP * 2;

const idxOf = (x: number, y: number) => y * N + x;

/** Posição visual (%) de cada nó, indexado por y*6+x. */
export const NODE_XY: readonly XY[] = Array.from({ length: CELLS }, (_, i) => ({
  x: BOARD_POINTS[i % N],
  y: BOARD_POINTS[(i / N) | 0],
}));

/** 0 = cima, 1 = baixo, 2 = esquerda, 3 = direita. Direção oposta = d ^ 1. */
export const DIRS = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
] as const;

const dirIndex = (dx: number, dy: number) => (dx === 0 ? (dy < 0 ? 0 : 1) : dx < 0 ? 2 : 3);

function computeArc(
  cx: number, cy: number, r: number,
  x0: number, y0: number, x1: number, y1: number,
): { svg: string; points: XY[] } {
  const TWO_PI = Math.PI * 2;
  const a0 = (Math.atan2(y0 - cy, x0 - cx) + TWO_PI) % TWO_PI;
  const a1 = (Math.atan2(y1 - cy, x1 - cx) + TWO_PI) % TWO_PI;

  let diff = a1 - a0;
  while (diff > Math.PI) diff -= TWO_PI;
  while (diff <= -Math.PI) diff += TWO_PI;
  const longDiff = diff > 0 ? diff - TWO_PI : diff + TWO_PI;
  const sweepFlag = longDiff > 0 ? 1 : 0;

  const points: XY[] = [];
  for (let i = 1; i <= ARC_SAMPLE_STEPS; i++) {
    const angle = a0 + longDiff * (i / ARC_SAMPLE_STEPS);
    points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }

  return { svg: `A ${r} ${r} 0 1 ${sweepFlag} ${x1} ${y1}`, points };
}

// ─────────────────────────────────────────────────────────────
// Loops (transições de raio pelas curvas)
// ─────────────────────────────────────────────────────────────

interface Transition {
  x: number;
  y: number;
  dir: number;
  arc: XY[];
}

export interface DecorativeLoop {
  path: string;
  size: 'small' | 'large';
}

export interface LoopTransition {
  from: { x: number; y: number; dir: number };
  to: { x: number; y: number; dir: number };
}

const LOOP_MAP: (Transition | null)[] = new Array(CELLS * 4).fill(null);
const DECORATIVE: DecorativeLoop[] = [];
const TRANSITIONS: LoopTransition[] = [];

/**
 * Registra um loop entre o estado A (em (ax,ay) andando (adx,ady)) e o estado B
 * (em (bx,by) andando (bdx,bdy)). Saindo por A chega-se em B na direção oposta a
 * (bdx,bdy), e vice-versa.
 */
function addLoop(
  ax: number, ay: number, adx: number, ady: number,
  bx: number, by: number, bdx: number, bdy: number,
  cx: number, cy: number, r: number,
) {
  const P = BOARD_POINTS;
  const ab = computeArc(cx, cy, r, P[ax], P[ay], P[bx], P[by]);
  const ba = computeArc(cx, cy, r, P[bx], P[by], P[ax], P[ay]);
  const aDir = dirIndex(adx, ady);
  const bDir = dirIndex(bdx, bdy);

  LOOP_MAP[idxOf(ax, ay) * 4 + aDir] = { x: bx, y: by, dir: bDir ^ 1, arc: ab.points };
  LOOP_MAP[idxOf(bx, by) * 4 + bDir] = { x: ax, y: ay, dir: aDir ^ 1, arc: ba.points };

  DECORATIVE.push({
    path: `M ${P[ax]} ${P[ay]} ${ab.svg}`,
    size: r === LOOP_RADIUS_SMALL ? 'small' : 'large',
  });
  TRANSITIONS.push(
    { from: { x: ax, y: ay, dir: aDir }, to: { x: bx, y: by, dir: bDir ^ 1 } },
    { from: { x: bx, y: by, dir: bDir }, to: { x: ax, y: ay, dir: aDir ^ 1 } },
  );
}

{
  const P = BOARD_POINTS;
  const S = LOOP_RADIUS_SMALL;
  const L = LOOP_RADIUS_LARGE;

  // canto superior esquerdo
  addLoop(0, 1, -1, 0, 1, 0, 0, -1, P[0], P[0], S);
  addLoop(0, 2, -1, 0, 2, 0, 0, -1, P[0], P[0], L);
  // canto superior direito
  addLoop(5, 1, 1, 0, 4, 0, 0, -1, P[5], P[0], S);
  addLoop(5, 2, 1, 0, 3, 0, 0, -1, P[5], P[0], L);
  // canto inferior esquerdo
  addLoop(0, 4, -1, 0, 1, 5, 0, 1, P[0], P[5], S);
  addLoop(0, 3, -1, 0, 2, 5, 0, 1, P[0], P[5], L);
  // canto inferior direito
  addLoop(5, 4, 1, 0, 4, 5, 0, 1, P[5], P[5], S);
  addLoop(5, 3, 1, 0, 3, 5, 0, 1, P[5], P[5], L);
}

export function getDecorativeLoops(): readonly DecorativeLoop[] {
  return DECORATIVE;
}

/** Exposto para testes de integridade geométrica. */
export function getLoopTransitions(): readonly LoopTransition[] {
  return TRANSITIONS;
}

// ─────────────────────────────────────────────────────────────
// Traces pré-computados: TRACES[idx][dir] = caminho completo do raio
// ─────────────────────────────────────────────────────────────

export interface TraceStep {
  x: number;
  y: number;
  idx: number;
  isLoopCrossing: boolean;
  /** Pontos visuais deste passo: 10 amostras de arco se for loop, senão o nó. */
  points: readonly XY[];
}

/** TRACES[idx][dir]: passos do raio até sair do tabuleiro ou fechar o ciclo. */
export const TRACES: TraceStep[][][] = [];

/**
 * CLOSING_STEP[idx][dir]: passo que fecharia o ciclo (chegada de volta ao estado
 * inicial). Só existe em circuitos fechados; usado como casa de pouso no modo 'hop'.
 */
export const CLOSING_STEP: (TraceStep | null)[][] = [];

function buildTrace(x: number, y: number, dir: number): { steps: TraceStep[]; closing: TraceStep | null } {
  const steps: TraceStep[] = [];
  let cx = x, cy = y, cd = dir;

  for (let guard = 0; guard < 64; guard++) {
    const t = LOOP_MAP[idxOf(cx, cy) * 4 + cd];
    let step: TraceStep;
    let nd: number;

    if (t) {
      step = { x: t.x, y: t.y, idx: idxOf(t.x, t.y), isLoopCrossing: true, points: t.arc };
      nd = t.dir;
    } else {
      const nx = cx + DIRS[cd][0];
      const ny = cy + DIRS[cd][1];
      if (nx < 0 || nx >= N || ny < 0 || ny >= N) return { steps, closing: null };
      const nidx = idxOf(nx, ny);
      step = { x: nx, y: ny, idx: nidx, isLoopCrossing: false, points: [NODE_XY[nidx]] };
      nd = cd;
    }

    if (step.x === x && step.y === y && nd === dir) return { steps, closing: step };

    steps.push(step);
    cx = step.x; cy = step.y; cd = nd;
  }
  return { steps, closing: null };
}

for (let idx = 0; idx < CELLS; idx++) {
  TRACES[idx] = [];
  CLOSING_STEP[idx] = [];
  for (let d = 0; d < 4; d++) {
    const { steps, closing } = buildTrace(idx % N, (idx / N) | 0, d);
    TRACES[idx][d] = steps;
    CLOSING_STEP[idx][d] = closing;
  }
}

// ─────────────────────────────────────────────────────────────
// Geração de lances
// ─────────────────────────────────────────────────────────────

export function toFlat(board: SurakartaPiece[][]): Int8Array {
  const flat = new Int8Array(CELLS);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) flat[y * N + x] = board[y][x];
  return flat;
}

interface MobilityInfo {
  n: number;
  caps: number;
}

/**
 * Núcleo do gerador. Se `out` for null, apenas conta (usado pela avaliação da IA).
 */
function gen(board: ArrayLike<number>, turn: number, out: SurakartaMove[] | null): MobilityInfo {
  let n = 0;
  let caps = 0;

  for (let idx = 0; idx < CELLS; idx++) {
    if (board[idx] !== turn) continue;
    const x = idx % N;
    const y = (idx - x) / N;

    // Passos simples: 8 vizinhos vazios
    for (let dy = -1; dy <= 1; dy++) {
      const ny = y + dy;
      if (ny < 0 || ny >= N) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        if (nx < 0 || nx >= N) continue;
        if (board[ny * N + nx] !== 0) continue;
        n++;
        if (out) out.push({ fromX: x, fromY: y, toX: nx, toY: ny, isCapture: false });
      }
    }

    // Capturas: segue os 4 raios ortogonais pelos circuitos
    let seen: number[] | null = null;
    for (let d = 0; d < 4; d++) {
      const steps = TRACES[idx][d];
      let loops = 0;

      for (let i = 0; i < steps.length; i++) {
        const s = steps[i];
        if (s.isLoopCrossing) loops++;

        const occ = s.idx === idx ? 0 : board[s.idx]; // origem conta como vazia
        if (occ === 0) continue;
        if (occ === turn) break;

        // Inimigo encontrado: precisa ter passado por ≥1 loop na aproximação
        if (loops > 0) {
          let land: TraceStep | null = s;
          if (CAPTURE_MODE === 'hop') {
            const nxt = steps[i + 1] ?? CLOSING_STEP[idx][d];
            land = nxt && (nxt.idx === idx || board[nxt.idx] === 0) ? nxt : null;
          }

          if (land) {
            // O mesmo alvo pode ser alcançado por mais de um raio; deduplica.
            const key = s.idx * CELLS + land.idx;
            if (!seen) seen = [];
            if (seen.indexOf(key) === -1) {
              seen.push(key);
              n++;
              caps++;
              if (out) {
                out.push({
                  fromX: x, fromY: y,
                  toX: land.x, toY: land.y,
                  isCapture: true,
                  capturedX: s.x, capturedY: s.y,
                  dir: d, targetIndex: i,
                });
              }
            }
          }
        }
        break;
      }
    }
  }

  return { n, caps };
}

/** Gera lances sobre um tabuleiro plano (usado pela IA). */
export function generateMovesFlat(board: ArrayLike<number>, turn: SurakartaPlayer): SurakartaMove[] {
  const out: SurakartaMove[] = [];
  gen(board, turn, out);
  return out;
}

/** Conta lances e capturas disponíveis sem alocar objetos de lance. */
export function countMobility(board: ArrayLike<number>, turn: SurakartaPlayer): MobilityInfo {
  return gen(board, turn, null);
}

export function generateLegalMoves(state: SurakartaState): SurakartaMove[] {
  return generateMovesFlat(toFlat(state.board), state.turn);
}

// ─────────────────────────────────────────────────────────────
// Estado
// ─────────────────────────────────────────────────────────────

function positionKey(flat: ArrayLike<number>, turn: SurakartaPlayer): string {
  let s = '';
  for (let i = 0; i < CELLS; i++) s += flat[i] === 1 ? 'x' : flat[i] === -1 ? 'o' : '.';
  return s + (turn === 1 ? 'B' : 'W');
}

export function createSurakartaState(board: SurakartaPiece[][], turn: SurakartaPlayer = 1): SurakartaState {
  return {
    board,
    turn,
    winner: null,
    endReason: null,
    history: [positionKey(toFlat(board), turn)],
    pliesWithoutCapture: 0,
  };
}

export function newSurakartaGame(): SurakartaState {
  return createSurakartaState([
    [ 1,  1,  1,  1,  1,  1],
    [ 1,  1,  1,  1,  1,  1],
    [ 0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
  ]);
}

export function applyMove(state: SurakartaState, move: SurakartaMove): SurakartaState {
  const board = state.board.map(row => [...row]);

  if (move.isCapture && move.capturedX !== undefined && move.capturedY !== undefined) {
    board[move.capturedY][move.capturedX] = 0;
  }
  board[move.toY][move.toX] = board[move.fromY][move.fromX];
  board[move.fromY][move.fromX] = 0;

  const flat = toFlat(board);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < CELLS; i++) {
    if (flat[i] === 1) p1++;
    else if (flat[i] === -1) p2++;
  }

  const nextTurn: SurakartaPlayer = state.turn === 1 ? -1 : 1;
  const pliesWithoutCapture = move.isCapture ? 0 : state.pliesWithoutCapture + 1;
  const key = positionKey(flat, nextTurn);
  const history = [...state.history, key];

  let winner: SurakartaPlayer | 0 | null = null;
  let endReason: SurakartaEndReason | null = null;

  if (p1 === 0) { winner = -1; endReason = 'elimination'; }
  else if (p2 === 0) { winner = 1; endReason = 'elimination'; }
  else {
    let reps = 0;
    for (let i = 0; i < history.length; i++) if (history[i] === key) reps++;

    if (reps >= 3) { winner = 0; endReason = 'repetition'; }
    else if (pliesWithoutCapture >= DRAW_PLIES) { winner = 0; endReason = 'noCapture'; }
    else if (gen(flat, nextTurn, null).n === 0) { winner = state.turn; endReason = 'stalemate'; }
  }

  return { board, turn: nextTurn, winner, endReason, history, pliesWithoutCapture };
}
