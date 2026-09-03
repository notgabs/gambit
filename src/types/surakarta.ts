export type SurakartaPiece = 1 | -1 | 0;

export interface SurakartaMove {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isCapture: boolean;

  /** Pontos (em % da viewBox 0-100) do trajeto de deslize, incluindo os arcos dos loops já amostrados em pequenos passos. */
  slidePoints?: { x: number; y: number }[];
  /** Se true, o último trecho é reto e vira um "salto" estilizado em vez de deslize. */
  hasFinalHop?: boolean;
  /** Casa de grade (índices 0-5) de onde parte o salto final. */
  preCaptureX?: number;
  preCaptureY?: number;
}

export interface SurakartaState {
  board: SurakartaPiece[][];
  turn: 1 | -1;
  winner: 1 | -1 | 0 | null;
  history: string[];
  pliesWithoutCapture: number;
}
