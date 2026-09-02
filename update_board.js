const fs = require('fs');
let code = fs.readFileSync('src/components/ChessBoard.tsx', 'utf8');

// Add import
code = code.replace(
  "import { playChessSound, resolveMoveSound } from '@/lib/chess/sound';",
  "import { playChessSound, resolveMoveSound } from '@/lib/chess/sound';\nimport ChessPiece from '@/components/ChessPiece';"
);

// Remove unicodeMap
code = code.replace(/const unicodeMap: Record<string, string> = {[\s\S]*?};\n/, '');

// Replace in PromotionPicker
code = code.replace(
  "const options: { type: PieceType; symbol: string }[] = [\n    { type: 'q', symbol: color === 'w' ? '♕' : '♛' },\n    { type: 'r', symbol: color === 'w' ? '♖' : '♜' },\n    { type: 'b', symbol: color === 'w' ? '♗' : '♝' },\n    { type: 'n', symbol: color === 'w' ? '♘' : '♞' },\n  ];",
  "const options: { type: PieceType }[] = [\n    { type: 'q' },\n    { type: 'r' },\n    { type: 'b' },\n    { type: 'n' },\n  ];"
);
code = code.replace(
  "{o.symbol}",
  "<ChessPiece type={o.type} color={color} className=\"w-10 h-10 md:w-12 md:h-12\" />"
);

// Replace in renderSquare
code = code.replace(
  "{unicodeMap[${piece.color}]}",
  "<ChessPiece type={piece.type} color={piece.color} className={isSelected ? 'drop-shadow-[0_8px_10px_rgba(0,0,0,0.6)]' : 'drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]'} />"
);

// We should also remove the text-color classes that were wrapping unicodeMap since SVGs are self-colored
code = code.replace(
  /className={	ext-4xl md:text-5xl select-none leading-none block transition-all duration-200 \ \}/g,
  "className={w-full h-full select-none block transition-all duration-200}"
);

// Replace header kings
code = code.replace(
  '<span className="text-4xl text-white drop-shadow-md">♔</span>',
  '<ChessPiece type="k" color="w" className="w-10 h-10 drop-shadow-md" />'
);
code = code.replace(
  '<span className="text-4xl text-black drop-shadow-md">♚</span>',
  '<ChessPiece type="k" color="b" className="w-10 h-10 drop-shadow-md" />'
);

fs.writeFileSync('src/components/ChessBoard.tsx', code, 'utf8');
