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
      const isKing = Math.abs(cell) === 2;
      const sign = owner === player ? 1 : -1;

      score += sign * (isKing ? KING : PIECE);

      if (r >= 2 && r <= 5 && c >= 2 && c <= 5) score += sign * CENTER_BONUS;

      if (!isKing) {
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
