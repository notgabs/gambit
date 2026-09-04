export type SurakartaPiece = 1 | -1 | 0;

export interface SurakartaMove {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isCapture: boolean;

  /** Pontos (% da viewBox) do trajeto de deslize ATÉ a casa anterior à peça capturada. Ausente se não há rail antes do salto. */
  slidePoints?: { x: number; y: number }[];

  /** Coordenadas de grade (0-5) da peça que será removida do tabuleiro. */
  capturedX?: number;
  capturedY?: number;

  /**
   * Pontos (% da viewBox) do "salto": da casa anterior à peça capturada,
   * passando por cima dela, até a casa de pouso (toX/toY).
   * Se o pouso ocorrer atravessando um loop, inclui os pontos do arco.
   */
  hopPoints: { x: number; y: number }[];

  /** Índice no array hopPoints onde a peça capturada se encontra (para sincronizar o efeito de impacto) */
  captureIndexInHop?: number;
}

export interface SurakartaState {
  board: SurakartaPiece[][];
  turn: 1 | -1;
  winner: 1 | -1 | 0 | null;
  history: string[];
  pliesWithoutCapture: number;
}
