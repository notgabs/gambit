self.onmessage = (e) => {
  const { board, player, level, rules } = e.data;

  const legal = generateLegalMoves(board, player, rules);
  if (!legal.length) {
    self.postMessage({ move: null });
    return;
  }

  if (level === 'facil') {
    const idx = Math.floor(Math.random() * legal.length);
    self.postMessage({ move: legal[idx] });
    return;
  }

  const maxDepth = level === 'medio' ? 3 : 6;
  const start = performance.now ? performance.now() : Date.now();
  const budget = level === 'dificil' ? 1200 : 0; 

  let bestMove = legal[0];
  let bestScore = -Infinity;

  for (let depth = 1; depth <= maxDepth; depth++) {
    const res = minimax(board, player, depth, -Infinity, Infinity, start, budget, rules, player);
    if (res.move === null) break; 
    bestMove = res.move;
    bestScore = res.score;
  }

  self.postMessage({ move: bestMove, score: bestScore });
};

// ... Helper functions
function isKing(c) { return Math.abs(c) === 2; }
function inside(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
function belongs(p, turn) { return turn === 1 ? p > 0 : p < 0; }

function getCapturesFrom(board, r, c, turn, rules, visited = [], isCombo = false) {
  const piece = board[r][c];
  if (piece === 0) return [];
  const isK = isKing(piece);
  
  let dirs;
  if (isK) {
    dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  } else {
    if (!rules.canCaptureBackwards && !isCombo) {
      dirs = turn === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
    } else {
      dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    }
  }

  const paths = [];

  for (const [dr, dc] of dirs) {
    let step = 1;
    let foundEnemy = null;

    while (true) {
      const currR = r + dr * step;
      const currC = c + dc * step;
      if (!inside(currR, currC)) break;

      const currCell = board[currR][currC];

      if (currCell === 0) {
        if (foundEnemy) {
          const newBoard = board.map((row) => row.slice());
          newBoard[r][c] = 0;
          newBoard[foundEnemy[0]][foundEnemy[1]] = 0;
          newBoard[currR][currC] = piece;

          const nextCaptures = getCapturesFrom(newBoard, currR, currC, turn, rules, [...visited, foundEnemy], true);

          let maxDesc = 0;
          let newFullPaths = [];
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
      } else if (belongs(currCell, turn)) {
        break;
      } else {
        if (foundEnemy || visited.some((v) => v[0] === currR && v[1] === currC)) {
          break;
        }
        foundEnemy = [currR, currC];
        
        if (!isK) {
          const landR = currR + dr;
          const landC = currC + dc;
          if (!inside(landR, landC) || board[landR][landC] !== 0) {
            break;
          }
        }
      }
      step++;
    }
  }
  return paths;
}

function generateLegalMoves(board, turn, rules, isCombo = false, startSquare = null) {
  let allCaptures = [];

  if (startSquare) {
    const [r, c] = startSquare;
    if (belongs(board[r][c], turn)) {
      allCaptures = getCapturesFrom(board, r, c, turn, rules, [], isCombo);
    }
  } else {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (belongs(board[r][c], turn)) {
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

  const moves = [];
  
  if (startSquare) return moves; // se tiver casa inicial para combo e n tem captura, volta zero

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!belongs(piece, turn)) continue;

      const dirs = turn === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
      const actualDirs = isKing(piece) ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : dirs;

      if (isKing(piece)) {
        for (const [dr, dc] of actualDirs) {
          let step = 1;
          while (true) {
            const currR = r + dr * step;
            const currC = c + dc * step;
            if (!inside(currR, currC)) break;
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
        for (const [dr, dc] of actualDirs) {
          const to = [r + dr, c + dc];
          if (!inside(to[0], to[1])) continue;
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

function willPromote(piece, to, turn) {
  if (isKing(piece)) return false;
  return turn === 1 ? to[0] === 0 : to[0] === 7;
}

function applyMove(board, move, turn) {
  const newBoard = board.map((row) => row.slice());
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
  newBoard[tr][tc] = piece;
  return newBoard;
}

function evaluateBoard(board, player, rules) {
  const PIECE = 100;
  const KING = 250;
  const CENTER_BONUS = 15;
  const PROMO_BONUS = 30;
  const VULN_PENALTY = 40;
  const MOBILITY_BONUS = 5;
  const CAPTURE_BONUS = 70;
  const PIECE_DIFF = 30;

  let score = 0;
  let myPieces = 0;
  let oppPieces = 0;

  const opponentMoves = generateLegalMoves(board, player * -1, rules);
  const vulnerable = new Set();
  opponentMoves.forEach(m => {
    if (m.capture) vulnerable.add(`${m.capture[0]},${m.capture[1]}`);
  });

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (!cell) continue;

      const owner = cell > 0 ? 1 : -1;
      const isKingPiece = Math.abs(cell) === 2;
      const sign = owner === player ? 1 : -1;

      score += sign * (isKingPiece ? KING : PIECE);

      if (r >= 2 && r <= 5 && c >= 2 && c <= 5) score += sign * CENTER_BONUS;

      if (!isKingPiece) {
        if (owner === 1 && r === 1) score += sign * PROMO_BONUS;
        if (owner === -1 && r === 6) score += sign * PROMO_BONUS;
      }

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

function evaluateWinnerFast(board, turn) {
  const opponent = (turn * -1);
  const my = board.flat().filter(c => turn === 1 ? c > 0 : c < 0).length;
  const opp = board.flat().filter(c => opponent === 1 ? c > 0 : c < 0).length;
  if (my === 0) return opponent;
  if (opp === 0) return turn;
  return null;
}

const TT = new Map();
function boardHash(board) {
  return board.flat().join('');
}

function minimax(board, player, depth, alpha, beta, startTime, timeBudget, rules, originalPlayer) {
  const hash = boardHash(board);
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

  if (depth <= 0 || winner !== null || legal.length === 0) {
    return { move: null, score: evaluateBoard(board, originalPlayer, rules) };
  }

  let bestMove = null;
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
    
    let nextTurn = (player * -1);
    let nextDepth = depth - 1;

    if (m.capture) {
      const furtherCaptures = generateLegalMoves(nextBoard, player, rules, true, m.to);
      if (furtherCaptures.length > 0) {
        nextTurn = player; 
        nextDepth = depth; 
      }
    }

    const res = minimax(nextBoard, nextTurn, nextDepth, alpha, beta, startTime, timeBudget, rules, originalPlayer);

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
  TT.set(hash, { depth, score: bestScore, flag });

  return { move: bestMove, score: bestScore };
}
