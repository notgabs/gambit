import { GameState, Move, Square } from './types';
import { isSquareAttacked, isOnBoard, getRank, getFile, opposite } from './attacks';
import { makeMove } from './makeMove';

export function generatePseudoLegalMoves(state: GameState): Move[] {
  const moves: Move[] = [];
  const color = state.turn;

  for (let sq = 0; sq < 64; sq++) {
    const piece = state.board[sq];
    if (!piece || piece.color !== color) continue;

    const r = getRank(sq);
    const f = getFile(sq);

    if (piece.type === 'p') {
      const dir = color === 'w' ? 1 : -1;
      const startRank = color === 'w' ? 1 : 6;
      const promRank = color === 'w' ? 7 : 0;

      // Single push
      const oneStep = sq + dir * 8;
      if (isOnBoard(oneStep) && !state.board[oneStep]) {
        addPawnMoves(moves, sq, oneStep, getRank(oneStep) === promRank);
        // Double push
        if (r === startRank) {
          const twoStep = sq + dir * 16;
          if (!state.board[twoStep]) {
            moves.push({ from: sq, to: twoStep });
          }
        }
      }

      // Captures
      for (const fOff of [-1, 1]) {
        if (f + fOff >= 0 && f + fOff < 8) {
          const capSq = sq + dir * 8 + fOff;
          if (isOnBoard(capSq)) {
            const target = state.board[capSq];
            if (target && target.color !== color) {
              addPawnMoves(moves, sq, capSq, getRank(capSq) === promRank);
            } else if (capSq === state.enPassant) {
              moves.push({ from: sq, to: capSq });
            }
          }
        }
      }
    } else if (piece.type === 'n') {
      const offsets = [15, 17, 6, 10, -15, -17, -6, -10];
      for (const off of offsets) {
        const target = sq + off;
        if (isOnBoard(target)) {
          const tr = getRank(target);
          const tf = getFile(target);
          if (Math.abs(tr - r) <= 2 && Math.abs(tf - f) <= 2) {
            const tPiece = state.board[target];
            if (!tPiece || tPiece.color !== color) {
              moves.push({ from: sq, to: target });
            }
          }
        }
      }
    } else if (piece.type === 'k') {
      const offsets = [8, 1, -8, -1, 7, 9, -7, -9];
      for (const off of offsets) {
        const target = sq + off;
        if (isOnBoard(target)) {
          const tr = getRank(target);
          const tf = getFile(target);
          if (Math.abs(tr - r) <= 1 && Math.abs(tf - f) <= 1) {
            const tPiece = state.board[target];
            if (!tPiece || tPiece.color !== color) {
              moves.push({ from: sq, to: target });
            }
          }
        }
      }

      // Castling
      const opp = opposite(color);
      const row = color === 'w' ? 0 : 7;
      if (sq === row * 8 + 4) { // King is at starting pos
        if (state.castling[color].k) {
          if (!state.board[row * 8 + 5] && !state.board[row * 8 + 6]) {
            if (!isSquareAttacked(state, sq, opp) &&
                !isSquareAttacked(state, sq + 1, opp) &&
                !isSquareAttacked(state, sq + 2, opp)) {
              moves.push({ from: sq, to: sq + 2 });
            }
          }
        }
        if (state.castling[color].q) {
          if (!state.board[row * 8 + 3] && !state.board[row * 8 + 2] && !state.board[row * 8 + 1]) {
            if (!isSquareAttacked(state, sq, opp) &&
                !isSquareAttacked(state, sq - 1, opp) &&
                !isSquareAttacked(state, sq - 2, opp)) {
              moves.push({ from: sq, to: sq - 2 });
            }
          }
        }
      }
    } else { // Bishop, Rook, Queen
      let dirs: number[] = [];
      if (piece.type === 'b' || piece.type === 'q') dirs.push(7, 9, -7, -9);
      if (piece.type === 'r' || piece.type === 'q') dirs.push(8, 1, -8, -1);

      for (const dir of dirs) {
        let currentSq = sq;
        let cr = r;
        let cf = f;

        while (true) {
          currentSq += dir;
          if (!isOnBoard(currentSq)) break;

          const nr = getRank(currentSq);
          const nf = getFile(currentSq);
          if (Math.abs(nr - cr) > 1 || Math.abs(nf - cf) > 1) break;

          const tPiece = state.board[currentSq];
          if (!tPiece) {
            moves.push({ from: sq, to: currentSq });
          } else {
            if (tPiece.color !== color) {
              moves.push({ from: sq, to: currentSq });
            }
            break;
          }
          cr = nr;
          cf = nf;
        }
      }
    }
  }

  return moves;
}

function addPawnMoves(moves: Move[], from: Square, to: Square, isPromotion: boolean) {
  if (isPromotion) {
    moves.push({ from, to, promotion: 'q' });
    moves.push({ from, to, promotion: 'r' });
    moves.push({ from, to, promotion: 'b' });
    moves.push({ from, to, promotion: 'n' });
  } else {
    moves.push({ from, to });
  }
}

export function generateLegalMoves(state: GameState): Move[] {
  const pseudoMoves = generatePseudoLegalMoves(state);
  const legalMoves: Move[] = [];
  const opp = opposite(state.turn);

  for (const move of pseudoMoves) {
    const { newState } = makeMove(state, move);
    // Find king square
    let kingSq = -1;
    for (let i = 0; i < 64; i++) {
      const p = newState.board[i];
      if (p && p.type === 'k' && p.color === state.turn) {
        kingSq = i;
        break;
      }
    }
    if (kingSq !== -1 && !isSquareAttacked(newState, kingSq, opp)) {
      legalMoves.push(move);
    }
  }

  return legalMoves;
}
