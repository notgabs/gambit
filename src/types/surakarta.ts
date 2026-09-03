export type SurakartaPiece = 1 | -1 | 0;

export interface SurakartaMove {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isCapture: boolean;
}

export interface SurakartaState {
  board: SurakartaPiece[][];
  turn: 1 | -1;
  winner: 1 | -1 | 0 | null;
  history: string[];
  pliesWithoutCapture: number;
}
