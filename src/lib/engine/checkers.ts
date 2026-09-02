// ------------------------------------------------------------------
// Lógica completa do jogo de damas (Checkers)
// ------------------------------------------------------------------

import type { Board, Move, Pos, Cell, GameState, GameRules } from '../../types/checkers';

/* ------------------------------------------------------------------ */
/*                     Funções Auxiliares                             */
/* ------------------------------------------------------------------ */

export function createBoard(): Board {
  const board: Board = Array(8).fill(0).map(() => Array(8).fill(0));
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) board[r][c] = -1;
        else if (r > 4) board[r][c] = 1;
      }
    }
  }
  return board;
}

export function isInside([r, c]: Pos): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function belongsTo(piece: Cell, turn: 1 | -1): boolean {
  if (piece === 0) return false;
  return turn === 1 ? piece > 0 : piece < 0;
}

function isKing(piece: Cell): boolean {
  return piece === 2 || piece === -2;
}

function moveDirections(piece: Cell): Pos[] {
  if (isKing(piece)) {
    return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  }
  const p = piece > 0 ? 1 : -1;
  return p === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

function captureDirections(piece: Cell): Pos[] {
  return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
}

/* ------------------------------------------------------------------ */
/*                     Geração de movimentos legais                   */
/* ------------------------------------------------------------------ */

function getCapturesFrom(
  board: Board,
  r: number,
  c: number,
  turn: 1 | -1,
  rules: GameRules,
  visited: Pos[] = [],
  isCombo: boolean = false
): { move: Move; maxDescendant: number; fullPaths: Pos[][] }[] {
  const piece = board[r][c];
  if (piece === 0) return [];
  const isK = isKing(piece);

  // ✅ CORREÇÃO: a regra "comer para trás" agora vale SEMPRE (primeiro
  // lance ou continuação de combo), não só na primeira captura da vez.
  let dirs: Pos[];
  if (isK) {
    dirs = captureDirections(piece);
  } else {
    dirs = rules.canCaptureBackwards ? captureDirections(piece) : moveDirections(piece);
  }

  const paths: { move: Move; maxDescendant: number; fullPaths: Pos[][] }[] = [];

  for (const [dr, dc] of dirs) {
    let step = 1;
    let foundEnemy: Pos | null = null;

    while (true) {
      const currR = r + dr * step;
      const currC = c + dc * step;
      if (!isInside([currR, currC])) break;

      const currCell = board[currR][currC];

      if (currCell === 0) {
        if (foundEnemy) {
          const newBoard = board.map((row) => row.slice()) as Board;
          newBoard[r][c] = 0;
          newBoard[foundEnemy[0]][foundEnemy[1]] = 0;
          newBoard[currR][currC] = piece;

          const nextCaptures = getCapturesFrom(
            newBoard,
            currR,
            currC,
            turn,
            rules,
            [...visited, foundEnemy],
            true
          );

          let maxDesc = 0;
          let newFullPaths: Pos[][] = [];
          if (nextCaptures.length > 0) {
            maxDesc = Math.max(...nextCaptures.map((p) => p.maxDescendant));
            for (const nc of nextCaptures) {
              if (nc.fullPaths && nc.fullPaths.length > 0) {
                for (const fp of nc.fullPaths) {
                  newFullPaths.push([[currR, currC], ...fp]);
                }
              }
            }
          } else {
            newFullPaths.push([[currR, currC]]);
          }

          paths.push({
            move: {
              from: [r, c],
              to: [currR, currC],
              capture: foundEnemy,
              promotion: false,
            },
            maxDescendant: 1 + maxDesc,
            fullPaths: newFullPaths
          });

          if (isK && rules.kingStopsImmediately) break;
        }
        if (!isK) break;
      } else if (belongsTo(currCell, turn)) {
        break;
      } else {
        if (foundEnemy || visited.some((v) => v[0] === currR && v[1] === currC)) {
          break;
        }
        foundEnemy = [currR, currC];

        if (!isK) {
          const landR = currR + dr;
          const landC = currC + dc;
          if (!isInside([landR, landC]) || board[landR][landC] !== 0) {
            break;
          }
        }
      }
      step++;
    }
  }
  return paths;
}

export function generateLegalMoves(
  board: Board,
  turn: 1 | -1,
  rules: GameRules = { canCaptureBackwards: true, kingStopsImmediately: false },
  isCombo: boolean = false,
  startSquare?: Pos
): Move[] {
  let allCaptures: { move: Move; maxDescendant: number; fullPaths: Pos[][] }[] = [];

  if (startSquare) {
    const [r, c] = startSquare;
    if (belongsTo(board[r][c], turn)) {
      allCaptures = getCapturesFrom(board, r, c, turn, rules, [], isCombo);
    }
  } else {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (belongsTo(board[r][c], turn)) {
          allCaptures = allCaptures.concat(getCapturesFrom(board, r, c, turn, rules, [], isCombo));
        }
      }
    }
  }

  if (allCaptures.length > 0) {
    const maxCaps = Math.max(...allCaptures.map((c) => c.maxDescendant));
    const bestCaptures = allCaptures.filter((c) => c.maxDescendant === maxCaps);

    return bestCaptures.map((c) => ({
      ...c.move,
      promotion: c.maxDescendant === 1 ? willPromote(board[c.move.from[0]][c.move.from[1]], c.move.to, turn) : false,
      fullPaths: c.fullPaths
    }));
  }

  // Se estamos no meio de um combo (startSquare definido) e não há mais
  // capturas, a sequência acabou — não há mais lances a partir dessa peça.
  if (isCombo && startSquare) {
    return [];
  }

  const moves: Move[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!belongsTo(piece, turn)) continue;

      const dirs = moveDirections(piece);

      if (isKing(piece)) {
        for (const [dr, dc] of dirs) {
          let step = 1;
          while (true) {
            const currR = r + dr * step;
            const currC = c + dc * step;
            if (!isInside([currR, currC])) break;
            if (board[currR][currC] !== 0) break;

            moves.push({
              from: [r, c],
              to: [currR, currC],
              promotion: false,
            });
            step++;
          }
        }
      } else {
        for (const [dr, dc] of dirs) {
          const to: Pos = [r + dr, c + dc];
          if (!isInside(to)) continue;
          if (board[to[0]][to[1]] !== 0) continue;

          moves.push({
            from: [r, c],
            to,
            promotion: willPromote(piece, to, turn),
          });
        }
      }
    }
  }

  return moves;
}

function willPromote(piece: Cell, to: Pos, turn: 1 | -1): boolean {
  if (isKing(piece)) return false;
  return turn === 1 ? to[0] === 0 : to[0] === 7;
}

/* ------------------------------------------------------------------ */
/*                     Aplicar um movimento no board                  */
/* ------------------------------------------------------------------ */
export function applyMove(board: Board, move: Move, turn: 1 | -1): Board {
  const newBoard = board.map((row) => row.slice()) as Board;

  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  let piece = newBoard[fr][fc];

  newBoard[fr][fc] = 0;

  if (move.capture) {
    const [cr, cc] = move.capture;
    newBoard[cr][cc] = 0;
  }

  if (move.promotion) {
    piece = turn * 2;
  }

  newBoard[tr][tc] = piece as Cell;
  return newBoard;
}

/* ------------------------------------------------------------------ */
/*                     Detectar fim de partida                        */
/* ------------------------------------------------------------------ */
function countPieces(board: Board, turn: 1 | -1): number {
  return board.flat().filter((c) => belongsTo(c, turn)).length;
}

export function evaluateWinner(board: Board, turn: 1 | -1, rules: GameRules): 1 | -1 | null {
  const opponent = (turn * -1) as 1 | -1;
  const myPieces = countPieces(board, turn);
  const oppPieces = countPieces(board, opponent);

  if (myPieces === 0) return opponent;
  if (oppPieces === 0) return turn;

  const moves = generateLegalMoves(board, turn, rules);
  if (moves.length === 0) return opponent;

  return null;
}

/* ------------------------------------------------------------------ */
/*                     Função de step completa (CORRIGIDA)            */
/* ------------------------------------------------------------------ */
export function step(state: GameState, move: Move): GameState {
  const newBoard = applyMove(state.board, move, state.turn);
  const winner = evaluateWinner(newBoard, state.turn, state.rules);

  let nextTurn: 1 | -1;
  let legalMoves: Move[];

  if (winner) {
    // Jogo acabou — não há mais lances possíveis.
    nextTurn = state.turn;
    legalMoves = [];
  } else if (move.capture) {
    // ✅ CORREÇÃO: escopa corretamente os lances para a MESMA peça que
    // acabou de capturar, em vez de recalcular o tabuleiro inteiro.
    // Isso garante que o jogador seja forçado a continuar com a peça
    // certa durante uma captura múltipla — regra oficial das damas.
    const continuation = generateLegalMoves(
      newBoard,
      state.turn,
      state.rules,
      true,
      move.to
    );

    if (continuation.length > 0) {
      nextTurn = state.turn;         // combo continua com a mesma peça
      legalMoves = continuation;
    } else {
      nextTurn = (state.turn * -1) as 1 | -1;
      legalMoves = generateLegalMoves(newBoard, nextTurn, state.rules);
    }
  } else {
    nextTurn = (state.turn * -1) as 1 | -1;
    legalMoves = generateLegalMoves(newBoard, nextTurn, state.rules);
  }

  return {
    ...state,
    board: newBoard,
    turn: nextTurn,
    winner,
    legalMoves,
    justPromotedPos: move.promotion ? move.to : null,
  };
}

/* ------------------------------------------------------------------ */
/*                     Função de reset (novo jogo)                    */
/* ------------------------------------------------------------------ */
export function newGame(rules?: GameRules): GameState {
  const defaultRules = { canCaptureBackwards: true, kingStopsImmediately: false };
  const gameRules = rules || defaultRules;
  const board = createBoard();
  return {
    board,
    turn: 1,
    winner: null,
    rules: gameRules,
    legalMoves: generateLegalMoves(board, 1, gameRules),
    justPromotedPos: null,
  };
}
