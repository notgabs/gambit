import { GameState, Move, MoveResult, PieceType, Piece } from './types';
import { generateLegalMoves } from './movegen';
import { getFile, getRank, isSquareAttacked, opposite } from './attacks';

const FILE_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function squareToAlgebraic(sq: number): string {
  const file = FILE_LETTERS[sq % 8];
  const rank = Math.floor(sq / 8) + 1;
  return `${file}${rank}`;
}

const PIECE_LETTER: Record<PieceType, string> = {
  p: '', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K',
};

/**
 * Converte um Move em notação algébrica padrão (SAN).
 * Ex: e4, Nf3, Bxc4, O-O, O-O-O, e8=Q, exd5, Qh4+, Rxe8#
 */
export function moveToSAN(
  prevState: GameState,
  move: Move,
  moveResult: MoveResult
): string {
  const piece = prevState.board[move.from];
  if (!piece) return '?';

  // Roque
  if (moveResult.isCastling) {
    const isKingside = move.to > move.from;
    let san = isKingside ? 'O-O' : 'O-O-O';
    return san + checkSuffix(moveResult);
  }

  const letter = PIECE_LETTER[piece.type];
  const toSq = squareToAlgebraic(move.to);
  const isCapture = !!moveResult.captured;

  let san = '';

  if (piece.type === 'p') {
    // Peão: se captura, mostra a coluna de origem (ex: exd5)
    if (isCapture) {
      san = `${FILE_LETTERS[getFile(move.from)]}x${toSq}`;
    } else {
      san = toSq;
    }
    if (move.promotion) {
      san += `=${PIECE_LETTER[move.promotion] || 'Q'}`;
    }
  } else {
    // Outras peças: precisa checar ambiguidade (duas peças iguais podem ir ao mesmo lugar)
    const disambiguation = getDisambiguation(prevState, move, piece);
    san = `${letter}${disambiguation}${isCapture ? 'x' : ''}${toSq}`;
  }

  return san + checkSuffix(moveResult);
}

/**
 * Verifica se o movimento causa xeque ou xeque-mate no oponente,
 * para adicionar '+' (xeque) ou '#' (mate) ao final da notação.
 */
function checkSuffix(moveResult: MoveResult): string {
  const s = moveResult.newState;
  let kingSq = -1;
  for (let i = 0; i < 64; i++) {
    const p = s.board[i];
    if (p && p.type === 'k' && p.color === s.turn) {
      kingSq = i;
      break;
    }
  }
  if (kingSq === -1) return '';

  const inCheck = isSquareAttacked(s, kingSq, opposite(s.turn));
  if (!inCheck) return '';

  const legal = generateLegalMoves(s);
  return legal.length === 0 ? '#' : '+';
}

/**
 * Determina se precisamos qualificar a peça de origem (ex: Nbd7, R1e2)
 * quando duas ou mais peças iguais podem alcançar a mesma casa de destino.
 */
function getDisambiguation(state: GameState, move: Move, piece: Piece): string {
  const legal = generateLegalMoves(state);
  const rivals = legal.filter(m =>
    m.to === move.to &&
    m.from !== move.from &&
    state.board[m.from]?.type === piece.type &&
    state.board[m.from]?.color === piece.color
  );

  if (rivals.length === 0) return '';

  const fromFile = getFile(move.from);
  const fromRank = getRank(move.from);
  const sameFile = rivals.some(m => getFile(m.from) === fromFile);
  const sameRank = rivals.some(m => getRank(m.from) === fromRank);

  if (!sameFile) return FILE_LETTERS[fromFile];        // Ex: Nbd7
  if (!sameRank) return String(fromRank + 1);          // Ex: N1d2
  return `${FILE_LETTERS[fromFile]}${fromRank + 1}`;   // Ex: Nb1d2 (caso raríssimo)
}
