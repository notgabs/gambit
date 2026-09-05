import { describe, it, expect } from 'vitest';
import type { SurakartaPiece, SurakartaMove, SurakartaPlayer } from '@/types/surakarta';
import {
  newSurakartaGame,
  createSurakartaState,
  generateLegalMoves,
  applyMove,
  getLoopTransitions,
  TRACES,
  BOARD_POINTS,
  CAPTURE_MODE,
  DRAW_PLIES,
} from './surakarta';
import { getMovePath } from './surakartaPath';

/** 'x' = 1 (pretas), 'o' = -1 (brancas), '.' = vazio. Linha = y. */
function board(rows: string[]): SurakartaPiece[][] {
  return rows.map(r => [...r].map(c => (c === 'x' ? 1 : c === 'o' ? -1 : 0)) as SurakartaPiece[]);
}

const captures = (moves: SurakartaMove[]) => moves.filter(m => m.isCapture);
const UP = 0;

describe('geometria dos loops', () => {
  it('tem 16 transições, todas na borda, todas com reverso consistente', () => {
    const t = getLoopTransitions();
    expect(t).toHaveLength(16);

    const find = (x: number, y: number, dir: number) =>
      t.find(tr => tr.from.x === x && tr.from.y === y && tr.from.dir === dir);

    for (const tr of t) {
      const onEdge = tr.from.x === 0 || tr.from.x === 5 || tr.from.y === 0 || tr.from.y === 5;
      expect(onEdge).toBe(true);
      const reverse = find(tr.to.x, tr.to.y, tr.to.dir ^ 1);
      expect(reverse).toBeDefined();
      expect(reverse!.to).toEqual({ x: tr.from.x, y: tr.from.y, dir: tr.from.dir ^ 1 });
    }
  });

  it('circuito pequeno fecha: (1,0) para cima percorre 23 passos e 4 loops', () => {
    const steps = TRACES[0 * 6 + 1][UP];
    expect(steps).toHaveLength(23);
    expect(steps.filter(s => s.isLoopCrossing)).toHaveLength(4);
  });

  it('raio ao longo da borda sai do tabuleiro (canto sem loop)', () => {
    expect(TRACES[0][UP]).toHaveLength(0);
  });
});

describe('geração de lances', () => {
  it('posição inicial: 16 lances, nenhuma captura', () => {
    const moves = generateLegalMoves(newSurakartaGame());
    expect(moves).toHaveLength(16);
    expect(captures(moves)).toHaveLength(0);
  });

  it('captura direta pela saída do loop', () => {
    const s = createSurakartaState(board([
      '.o....',
      'x.....',
      '......',
      '......',
      '......',
      '......',
    ]));
    const caps = captures(generateLegalMoves(s));
    expect(caps).toHaveLength(1);
    expect(caps[0]).toMatchObject({ fromX: 0, fromY: 1, capturedX: 1, capturedY: 0 });
    if (CAPTURE_MODE === 'standard') {
      expect(caps[0]).toMatchObject({ toX: 1, toY: 0 });
    } else {
      expect(caps[0]).toMatchObject({ toX: 1, toY: 1 });
    }
  });

  it('aproximação reta sem loop NÃO captura', () => {
    // (1,3) sobe até o inimigo em (1,1) sem loop; outras direções bloqueadas por peças amigas
    const s = createSurakartaState(board([
      '......',
      '.o....',
      '......',
      'xxx...',
      '.x....',
      '......',
    ]));
    const caps = captures(generateLegalMoves(s)).filter(m => m.fromX === 1 && m.fromY === 3);
    expect(caps).toHaveLength(0);
  });

  it('peça amiga no caminho bloqueia a captura', () => {
    const s = createSurakartaState(board([
      '.o....',
      'x.....',
      '......',
      '......',
      '......',
      '.x....',   // não interfere no raio esquerdo; agora bloqueia (0,1) esq→loop? não: testa via cima
    ]));
    // cima de (0,1): (0,0) vazio → sai. esquerda: loop → (1,0) inimigo → captura. Bloqueia trocando (1,0) por amigo:
    const blocked = createSurakartaState(board([
      '.x....',
      'x.....',
      '......',
      '......',
      '......',
      '......',
    ]));
    expect(captures(generateLegalMoves(s)).length).toBeGreaterThan(0);
    expect(captures(generateLegalMoves(blocked))).toHaveLength(0);
  });

  it('a casa de origem conta como vazia durante o trajeto', () => {
    // (1,1) sobe → (1,0) → loop → (0,1) → passa pela origem (1,1) → captura (2,1).
    // (1,2) amigo bloqueia os outros raios que chegariam em (2,1).
    const s = createSurakartaState(board([
      '......',
      '.xo...',
      '.x....',
      '......',
      '......',
      '......',
    ]));
    const caps = captures(generateLegalMoves(s)).filter(m => m.fromX === 1 && m.fromY === 1);
    expect(caps).toHaveLength(1);
    expect(caps[0]).toMatchObject({ capturedX: 2, capturedY: 1 });
  });

  it('cantos nunca são capturados e lances são sempre consistentes (propriedade)', () => {
    const corners = new Set([0, 5, 30, 35]);
    for (let trial = 0; trial < 300; trial++) {
      const b: SurakartaPiece[][] = Array.from({ length: 6 }, () =>
        Array.from({ length: 6 }, () => ([0, 0, 1, -1] as SurakartaPiece[])[Math.floor(Math.random() * 4)]),
      );
      for (const turn of [1, -1] as SurakartaPlayer[]) {
        for (const m of generateLegalMoves(createSurakartaState(b, turn))) {
          expect(b[m.fromY][m.fromX]).toBe(turn);
          if (m.isCapture) {
            expect(corners.has(m.capturedY! * 6 + m.capturedX!)).toBe(false);
            expect(b[m.capturedY!][m.capturedX!]).toBe(-turn);
          } else {
            expect(b[m.toY][m.toX]).toBe(0);
          }
        }
      }
    }
  });
});

describe('fim de jogo', () => {
  it('eliminação do último inimigo', () => {
    const s = createSurakartaState(board([
      '.o....',
      'x.....',
      '......',
      '......',
      '......',
      '......',
    ]));
    const cap = captures(generateLegalMoves(s))[0];
    const next = applyMove(s, cap);
    expect(next.winner).toBe(1);
    expect(next.endReason).toBe('elimination');
  });

  it('repetição tripla empata', () => {
    let s = createSurakartaState(board([
      'x.....',
      '......',
      '......',
      '......',
      '......',
      '.....o',
    ]));
    const mv = (fx: number, fy: number, tx: number, ty: number): SurakartaMove =>
      ({ fromX: fx, fromY: fy, toX: tx, toY: ty, isCapture: false });
    const cycle = [mv(0, 0, 0, 1), mv(5, 5, 5, 4), mv(0, 1, 0, 0), mv(5, 4, 5, 5)];

    for (let i = 0; i < 7; i++) {
      s = applyMove(s, cycle[i % 4]);
      expect(s.winner).toBeNull();
    }
    s = applyMove(s, cycle[3]);
    expect(s.winner).toBe(0);
    expect(s.endReason).toBe('repetition');
  });

  it(`${DRAW_PLIES} lances sem captura empatam`, () => {
    const s = { ...createSurakartaState(board([
      'x.....',
      '......',
      '......',
      '......',
      '......',
      '.....o',
    ])), pliesWithoutCapture: DRAW_PLIES - 1 };
    const next = applyMove(s, { fromX: 0, fromY: 0, toX: 1, toY: 1, isCapture: false });
    expect(next.winner).toBe(0);
    expect(next.endReason).toBe('noCapture');
  });
});

describe('path de animação', () => {
  it('captura pela saída do loop: sem slide, hop = casa anterior + 10 pontos de arco', () => {
    const s = createSurakartaState(board([
      '.o....',
      'x.....',
      '......',
      '......',
      '......',
      '......',
    ]));
    const cap = captures(generateLegalMoves(s))[0];
    const p = getMovePath(cap)!;

    expect(p.slidePoints).toBeNull();
    expect(p.captureIndexInHop).toBe(10);
    expect(p.hopPoints[0]).toEqual({ x: BOARD_POINTS[0], y: BOARD_POINTS[1] });
    expect(p.hopPoints[10].x).toBeCloseTo(BOARD_POINTS[1]);
    expect(p.hopPoints[10].y).toBeCloseTo(BOARD_POINTS[0]);
    expect(p.hopPoints).toHaveLength(CAPTURE_MODE === 'standard' ? 11 : 12);
  });

  it('lance normal não tem path', () => {
    expect(getMovePath({ fromX: 0, fromY: 1, toX: 0, toY: 2, isCapture: false })).toBeNull();
  });
});
