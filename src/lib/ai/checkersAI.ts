import { generateLegalMoves, applyMove } from '@/lib/engine/checkers';
import type { Board, Move, GameRules } from '@/types/checkers';

export type Difficulty = 'facil' | 'medio' | 'dificil';

// Piece-Square Table para peças normais — índice 0 = fileira de promoção,
// índice 7 = fileira inicial. Bordas (col 0 e col 7) recebem bônus por
// serem seguras contra captura (não dá pra saltar por fora do tabuleiro).
const MAN_PST = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [34, 32, 34, 34, 34, 34, 32, 34],
  [22, 20, 24, 24, 24, 24, 20, 22],
  [14, 12, 18, 20, 20, 18, 12, 14],
  [10,  8, 14, 16, 16, 14,  8, 10],
  [ 6,  4, 10, 10, 10, 10,  4,  6],
  [ 4,  2,  6,  6,  6,  6,  2,  4],
  [ 2,  0,  0,  0,  0,  0,  0,  2],
];

// Damas preferem o centro (mais mobilidade), evitam bordas.
const KING_PST = [
  [ 0,  5,  5,  5,  5,  5,  5,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [ 5, 10, 15, 15, 15, 15, 10,  5],
  [ 5, 10, 15, 20, 20, 15, 10,  5],
  [ 5, 10, 15, 20, 20, 15, 10,  5],
  [ 5, 10, 15, 15, 15, 15, 10,  5],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [ 0,  5,  5,  5,  5,  5,  5,  0],
];

function manPstValue(r: number, c: number, owner: 1 | -1): number {
  // Espelha a tabela conforme a direção de promoção de cada jogador.
  const row = owner === 1 ? r : 7 - r;
  return MAN_PST[row][c];
}

function kingPstValue(r: number, c: number): number {
  return KING_PST[r][c];
}

export function evaluateBoard(board: Board, player: 1 | -1, rules: GameRules): number {
  const PIECE = 100;
  const KING = 280;
  const VULN_PENALTY = 45;
  const MOBILITY_BONUS = 4;
  const CAPTURE_BONUS = 60;
  const PIECE_DIFF = 25;

  let score = 0;
  let myPieces = 0;
  let oppPieces = 0;

  const opponentMoves = generateLegalMoves(board, (player * -1) as 1 | -1, rules);
  const vulnerable = new Set<string>();
  opponentMoves.forEach(m => {
    if (m.capture) vulnerable.add(`${m.capture[0]},${m.capture[1]}`);
  });

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (!cell) continue;

      const owner = cell > 0 ? 1 : -1;
      const isKing = Math.abs(cell) === 2;
      const sign = owner === player ? 1 : -1;

      score += sign * (isKing ? KING : PIECE);
      score += sign * (isKing ? kingPstValue(r, c) : manPstValue(r, c, owner));

      if (vulnerable.has(`${r},${c}`)) score -= sign * VULN_PENALTY;

      if (sign === 1) myPieces++; else oppPieces++;
    }
  }

  const myMoves = generateLegalMoves(board, player, rules);
  const safeMoves = myMoves.filter(m => !m.capture);
  const oppSafe = opponentMoves.filter(m => !m.capture);

  score += safeMoves.length * MOBILITY_BONUS;
  score -= oppSafe.length * MOBILITY_BONUS;

  if (myMoves.some(m => m.capture)) score += CAPTURE_BONUS;
  score += (myPieces - oppPieces) * PIECE_DIFF;

  return score;
}

function evaluateWinnerFast(board: Board, turn: 1 | -1): 1 | -1 | null {
  const opponent = (turn * -1) as 1 | -1;
  const count = (p: 1 | -1) => board.flat().filter((c: any) => (p === 1 ? c > 0 : c < 0)).length;

  const myPieces = count(turn);
  const oppPieces = count(opponent);

  if (myPieces === 0) return opponent;
  if (oppPieces === 0) return turn;

  return null;
}

type MinimaxResult = { move: Move | null; score: number };

type TTEntry = { depth: number; score: number; flag: 'EXACT' | 'LOWER' | 'UPPER' };
const TT = new Map<string, TTEntry>();
const MAX_TT_ENTRIES = 150_000;

export function resetTT() {
  TT.clear();
}

// ✅ CORREÇÃO: o hash agora inclui de quem é a vez de jogar E a
// perspectiva original da busca. Antes, a mesma posição de tabuleiro
// com turnos diferentes (ou buscas de lados diferentes) podia
// compartilhar por engano o mesmo valor de cache.
function boardHash(board: Board, player: 1 | -1, originalPlayer: 1 | -1): string {
  return board.flat().join('') + '|' + player + '|' + originalPlayer;
}

export function minimax(
  board: Board,
  player: 1 | -1,
  depth: number,
  alpha: number,
  beta: number,
  startTime: number,
  timeBudget: number,
  rules: GameRules,
  originalPlayer: 1 | -1
): MinimaxResult {
  const hash = boardHash(board, player, originalPlayer);
  const entry = TT.get(hash);
  if (entry && entry.depth >= depth) {
    if (entry.flag === 'EXACT') return { move: null, score: entry.score };
    if (entry.flag === 'LOWER' && entry.score > alpha) alpha = entry.score;
    if (entry.flag === 'UPPER' && entry.score < beta) beta = entry.score;
    if (alpha >= beta) return { move: null, score: entry.score };
  }

  if (timeBudget > 0 && performance.now() - startTime > timeBudget) {
    return { move: null, score: 0 };
  }

  const legal = generateLegalMoves(board, player, rules);
  const winner = evaluateWinnerFast(board, player);
  const isTerminal = winner !== null || legal.length === 0;

  if (depth <= 0 || isTerminal) {
    let val: number;
    if (isTerminal) {
      // ✅ CORREÇÃO: agora a IA entende de fato quando alguém ganhou/perdeu
      // por falta de jogadas ou peças — antes só olhava material, então
      // não enxergava armadilhas nem evitava se encurralar.
      val = player === originalPlayer ? -(100000 + depth) : (100000 + depth);
    } else {
      val = evaluateBoard(board, originalPlayer, rules);
    }
    return { move: null, score: val };
  }

  let bestMove: Move | null = null;
  let bestScore = player === originalPlayer ? -Infinity : Infinity;

  const ordered = legal
    .map(m => ({
      m,
      score: m.capture ? 1000 : (m.promotion ? 500 : 0)
    }))
    .sort((a, b) => b.score - a.score)
    .map(o => o.m);

  for (const m of ordered) {
    const nextBoard = applyMove(board, m, player);

    let nextTurn = (player * -1) as 1 | -1;
    let nextDepth = depth - 1;

    if (m.capture) {
      const furtherCaptures = generateLegalMoves(nextBoard, player, rules, true, m.to);
      if (furtherCaptures.length > 0) {
        nextTurn = player;
        nextDepth = depth;
      }
    }

    const res = minimax(
      nextBoard,
      nextTurn,
      nextDepth,
      alpha,
      beta,
      startTime,
      timeBudget,
      rules,
      originalPlayer
    );

    if (player === originalPlayer) {
      if (res.score > bestScore) {
        bestScore = res.score;
        bestMove = m;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (res.score < bestScore) {
        bestScore = res.score;
        bestMove = m;
      }
      beta = Math.min(beta, bestScore);
    }

    if (beta <= alpha) break;
  }

  const flag = bestScore <= alpha ? 'UPPER' : bestScore >= beta ? 'LOWER' : 'EXACT';
  if (TT.size > MAX_TT_ENTRIES) TT.clear();
  TT.set(hash, { depth, score: bestScore, flag });

  return { move: bestMove, score: bestScore };
}
