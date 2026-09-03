export type AdugoBoard = number[]; // 31 posições: 1 (Onça), -1 (Cães), 0 (Vazio)

export interface AdugoMove {
  from: number;
  to: number;
  capture?: number;
}

export interface AdugoRules {
  maxCapturesToWin: number;
  drawAfterRepetitions: number;
  drawAfterPliesWithoutCapture: number;
}

export interface AdugoState {
  board: AdugoBoard;
  turn: 1 | -1;
  winner: 1 | -1 | 0 | null; // 0 = Empate
  dogsCaptured: number;
  legalMoves: AdugoMove[];
  history: string[];
  rules: AdugoRules;
  pliesPlayed: number;
  pliesWithoutCapture: number;
  lastMove?: AdugoMove;
}
