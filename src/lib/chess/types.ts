export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Piece {
  type: PieceType;
  color: Color;
}

export type Square = number; // 0-63 (a1=0, h8=63)

export interface CastlingRights {
  w: { k: boolean; q: boolean };
  b: { k: boolean; q: boolean };
}

export interface GameState {
  board: (Piece | null)[];
  turn: Color;
  castling: CastlingRights;
  enPassant: Square | null;
  halfMoveClock: number;
  fullMoveNumber: number;
  history?: number[];
}

export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceType;
}

export interface MoveResult {
  newState: GameState;
  captured?: Piece;
  isEnPassant?: boolean;
  isPromotion?: boolean;
  isCastling?: boolean;
}
