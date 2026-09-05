import type { SurakartaState } from '@/types/surakarta';
import { generateLegalMoves } from './surakarta';

export function xyToNotation(x: number, y: number): string {
  return `${'abcdef'[5 - y]}${x + 1}`;
}

export function notationToXY(notation: string): { x: number; y: number } {
  const y = 5 - 'abcdef'.indexOf(notation[0].toLowerCase());
  const x = parseInt(notation.slice(1), 10) - 1;
  return { x, y };
}

export function debugMovesFrom(state: SurakartaState, notation: string) {
  const { x, y } = notationToXY(notation);
  const piece = state.board[y]?.[x];
  const moves = generateLegalMoves(state).filter(m => m.fromX === x && m.fromY === y);

  const result = {
    origem: notation,
    coordenadaInterna: { x, y },
    peca: piece === 1 ? 'Preta' : piece === -1 ? 'Branca' : 'Vazia',
    movimentos: moves.map(m => ({
      destino: xyToNotation(m.toX, m.toY),
      tipo: m.isCapture ? 'CAPTURA' : 'normal',
      captura: m.isCapture ? xyToNotation(m.capturedX!, m.capturedY!) : null,
    })),
  };

  console.table(result.movimentos);
  return result;
}
