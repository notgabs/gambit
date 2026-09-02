// 0 = Ponto vazio
// 1 = Onça
// -1 = Cachorro (Lobo)
export type AdugoCell = 0 | 1 | -1;

// O tabuleiro tem 31 posições indexadas de 0 a 30.
export type AdugoBoard = AdugoCell[];

// O movimento consiste na posição de origem e destino
export interface AdugoMove {
  from: number;
  to: number;
  capture?: number; // Se a onça pular, registra qual nó (cachorro) foi capturado
}

export interface AdugoRules {
  maxCapturesToWin: number; // Padrão: 5
}

export interface AdugoState {
  board: AdugoBoard;
  turn: 1 | -1;            // 1 = Onça, -1 = Cachorros
  winner: 1 | -1 | 0 | null; // 0 = Empate, null = Jogo rolando
  dogsCaptured: number;
  legalMoves: AdugoMove[];
  history: string[];       // Histórico para detectar empate por repetição
  rules: AdugoRules;
}
