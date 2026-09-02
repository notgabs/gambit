// ------------------------------------------
// Representação do tabuleiro
// 0  = casa vazia
// 1  = peça verde (player 1)      — “tampinha verde”
// -1 = peça vermelha (player -1)  — “tampinha vermelha”
// 2  = dama verde   (king)
// -2 = dama vermelha (king)
// ------------------------------------------

export type Cell = 0 | 1 | -1 | 2 | -2;
export type Board = Cell[][]; // sempre 8x8

// coordenada de uma casa
export type Pos = [row: number, col: number];

// movimento simples ou captura
export type Move = {
  from: Pos;
  to: Pos;
  /** Se a jogada inclui captura, indica a posição da peça capturada */
  capture?: Pos;
  /** Se a peça chegou ao outro lado e virou dama */
  promotion?: boolean;
  /** Sequências completas de casas de pouso para combos */
  fullPaths?: Pos[][];
};

export interface GameRules {
  canCaptureBackwards: boolean;
  kingStopsImmediately: boolean;
}

// retorno da engine
export type GameState = {
  board: Board;
  turn: 1 | -1;          // 1 = verde (primeiro), -1 = vermelho
  winner: 1 | -1 | null; // null → jogo ainda ativo
  // lista de jogadas possíveis a partir do estado corrente
  legalMoves: Move[];
  justPromotedPos?: Pos | null;
  rules: GameRules;
};
