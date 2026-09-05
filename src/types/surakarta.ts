export type SurakartaPiece = 1 | -1 | 0;
export type SurakartaPlayer = 1 | -1;

export interface XY {
  x: number;
  y: number;
}

export type SurakartaEndReason = 'elimination' | 'stalemate' | 'repetition' | 'noCapture';

export interface SurakartaMove {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isCapture: boolean;

  /** Coordenadas da peça removida. Só em capturas. */
  capturedX?: number;
  capturedY?: number;

  /**
   * Direção ortogonal inicial (0=cima,1=baixo,2=esq,3=dir) e índice do alvo no trace.
   * Só em capturas. Usados por `getMovePath` para reconstruir a animação — a engine
   * não carrega pontos de animação.
   */
  dir?: number;
  targetIndex?: number;
}

export interface SurakartaState {
  board: SurakartaPiece[][];
  turn: SurakartaPlayer;
  winner: SurakartaPlayer | 0 | null;
  endReason: SurakartaEndReason | null;
  history: string[];
  pliesWithoutCapture: number;
}
