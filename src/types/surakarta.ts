export type SurakartaPiece = 1 | -1 | 0;

export interface SurakartaMove {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isCapture: boolean;

  /** Caminho SVG (retas + arcos) do início até a casa ANTES do salto final. */
  railPath?: string;
  /** Quantidade de "passos" no railPath — usado para calcular a duração da animação. */
  railSteps?: number;
  /** Casa imediatamente antes da peça capturada (de onde parte o salto). */
  preCaptureX?: number;
  preCaptureY?: number;
  /**
   * Se true, o último passo é uma reta simples e vira um "salto" estilizado.
   * Se false, o último passo é a saída de um loop — nesse caso a peça
   * apenas desliza até o fim (sem salto), para não cortar caminho reto
   * por cima do tabuleiro.
   */
  hasFinalHop?: boolean;
}

export interface SurakartaState {
  board: SurakartaPiece[][];
  turn: 1 | -1;
  winner: 1 | -1 | 0 | null;
  history: string[];
  pliesWithoutCapture: number;
}
