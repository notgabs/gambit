const fs = require('fs');
let code = fs.readFileSync('src/components/ChessBoard.tsx', 'utf8');

code = code.replace(
  "{unicodeMap[${piece.color}]}",
  "<ChessPiece type={piece.type as any} color={piece.color} className={isSelected ? 'drop-shadow-[0_8px_10px_rgba(0,0,0,0.6)]' : 'drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]'} />"
);

fs.writeFileSync('src/components/ChessBoard.tsx', code, 'utf8');
