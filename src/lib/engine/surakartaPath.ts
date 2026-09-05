import type { SurakartaMove, XY } from '@/types/surakarta';
import { TRACES, CLOSING_STEP, NODE_XY, CAPTURE_MODE } from './surakarta';

export interface MovePath {
  /** Deslize pelos trilhos/loops até a casa anterior ao alvo. null se o alvo é o 1º passo. */
  slidePoints: XY[] | null;
  /** Salto: casa anterior → (arco) → alvo [→ pouso, no modo 'hop']. */
  hopPoints: XY[];
  /** Índice em hopPoints onde a peça capturada está. */
  captureIndexInHop: number;
}

export function getMovePath(move: SurakartaMove): MovePath | null {
  if (!move.isCapture || move.dir === undefined || move.targetIndex === undefined) return null;

  const fromIdx = move.fromY * 6 + move.fromX;
  const steps = TRACES[fromIdx][move.dir];
  const i = move.targetIndex;

  const rail: XY[] = [NODE_XY[fromIdx]];
  for (let k = 0; k < i; k++) rail.push(...steps[k].points);

  const hop: XY[] = [rail[rail.length - 1], ...steps[i].points];
  const captureIndexInHop = hop.length - 1;

  if (CAPTURE_MODE === 'hop') {
    const land = steps[i + 1] ?? CLOSING_STEP[fromIdx][move.dir];
    if (land) hop.push(...land.points);
  }

  return { slidePoints: rail.length > 1 ? rail : null, hopPoints: hop, captureIndexInHop };
}
