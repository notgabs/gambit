import { GameState } from './types';

// Simple seeded PRNG to ensure reproducibility
class PRNG {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    // xorshift32ish
    this.seed ^= this.seed << 13;
    this.seed ^= this.seed >>> 17;
    this.seed ^= this.seed << 5;
    return this.seed >>> 0;
  }
}

const prng = new PRNG(12345);

const ZOBRIST = {
  pieces: {} as Record<string, number[]>, // piece string -> 64 numbers
  turn: prng.next(),
  castling: {
    w: { k: prng.next(), q: prng.next() },
    b: { k: prng.next(), q: prng.next() }
  },
  enPassant: [] as number[]
};

const pieceTypes = ['p', 'n', 'b', 'r', 'q', 'k'];
const colors = ['w', 'b'];

for (const c of colors) {
  for (const t of pieceTypes) {
    const key = c + t;
    ZOBRIST.pieces[key] = [];
    for (let i = 0; i < 64; i++) {
      ZOBRIST.pieces[key].push(prng.next());
    }
  }
}

for (let i = 0; i < 64; i++) {
  ZOBRIST.enPassant.push(prng.next());
}

export function stateHash(state: GameState): number {
  let hash = 0;

  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (p) {
      hash ^= ZOBRIST.pieces[p.color + p.type][i];
    }
  }

  if (state.turn === 'w') {
    hash ^= ZOBRIST.turn;
  }

  if (state.castling.w.k) hash ^= ZOBRIST.castling.w.k;
  if (state.castling.w.q) hash ^= ZOBRIST.castling.w.q;
  if (state.castling.b.k) hash ^= ZOBRIST.castling.b.k;
  if (state.castling.b.q) hash ^= ZOBRIST.castling.b.q;

  if (state.enPassant !== null) {
    hash ^= ZOBRIST.enPassant[state.enPassant];
  }

  return hash >>> 0; // ensure unsigned 32-bit
}
