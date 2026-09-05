'use client';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Trophy, AlertTriangle, Cpu } from 'lucide-react';
import {
  newSurakartaGame,
  applyMove,
  generateLegalMoves,
  getDecorativeLoops,
  BOARD_POINTS,
} from '@/lib/engine/surakarta';
import { getMovePath } from '@/lib/engine/surakartaPath';
import type { SurakartaState, SurakartaMove, SurakartaEndReason, XY } from '@/types/surakarta';
import { askSurakartaAI, resetSurakartaAI } from '@/lib/ai/askSurakartaAI';

declare global {
  interface Window {
    debugSurakarta?: (notation: string) => unknown;
    surakartaState?: SurakartaState;
  }
}

const SLIDE_SPEED_FACTOR = 0.012;
const MIN_SLIDE_DURATION = 0.35;
const HOP_SPEED_FACTOR = 0.013;
const MIN_HOP_DURATION = 0.38;
const JUMP_HEIGHT = 15;
/** O impacto nunca é agendado depois deste ponto do salto, pra dar tempo do efeito aparecer. */
const MAX_IMPACT_RATIO = 0.85;

const AI_PLAYER = -1;
const DECORATIVE_LOOPS = getDecorativeLoops();

const END_MESSAGES: Record<SurakartaEndReason, string> = {
  elimination: '',
  stalemate: 'Adversário sem lances!',
  repetition: 'Empate por repetição',
  noCapture: 'Empate: 60 lances sem captura',
};

function computeTimes(points: XY[]): number[] {
  if (points.length <= 1) return [0, 1];
  const acc = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    acc.push(total);
  }
  if (total === 0) return points.map((_, i) => i / (points.length - 1));
  return acc.map(d => d / total);
}

function computeTotalDistance(points: XY[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

export default function SurakartaBoard() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'ai' ? 'ai' : 'offline';
  const difficulty = searchParams.get('difficulty') || 'medio';

  const [state, setState] = useState<SurakartaState>(newSurakartaGame);
  const [selected, setSelected] = useState<XY | null>(null);
  const [pendingMove, setPendingMove] = useState<SurakartaMove | null>(null);
  const [animPhase, setAnimPhase] = useState<'slide' | 'jump' | null>(null);
  const [impacted, setImpacted] = useState(false);
  const gen = useRef(0);

  const isThinking = mode === 'ai' && state.turn === AI_PLAYER && state.winner === null;

  // Ferramentas de console (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    import('@/lib/engine/surakarta.debug').then(({ debugMovesFrom }) => {
      window.debugSurakarta = n => debugMovesFrom(state, n);
      window.surakartaState = state;
    });
  }, [state]);

  const legalMoves = useMemo(() => generateLegalMoves(state), [state]);

  const destinations = useMemo(() => {
    const map = new Map<string, SurakartaMove>();
    if (!selected) return map;
    for (const m of legalMoves) {
      if (m.fromX === selected.x && m.fromY === selected.y) map.set(`${m.toX},${m.toY}`, m);
    }
    return map;
  }, [selected, legalMoves]);

  const capturedTargets = useMemo(() => {
    const s = new Set<string>();
    for (const m of destinations.values()) {
      if (m.isCapture) s.add(`${m.capturedX},${m.capturedY}`);
    }
    return s;
  }, [destinations]);

  const movable = useMemo(() => {
    const s = new Set<string>();
    for (const m of legalMoves) s.add(`${m.fromX},${m.fromY}`);
    return s;
  }, [legalMoves]);

  const path = useMemo(() => (pendingMove ? getMovePath(pendingMove) : null), [pendingMove]);

  const slideInfo = useMemo(() => {
    if (!path?.slidePoints) return null;
    const points = path.slidePoints;
    return {
      points,
      duration: Math.max(MIN_SLIDE_DURATION, computeTotalDistance(points) * SLIDE_SPEED_FACTOR),
      times: computeTimes(points),
    };
  }, [path]);

  const hopInfo = useMemo(() => {
    if (!path || path.hopPoints.length < 2) return null;
    const points = path.hopPoints;
    const times = computeTimes(points);
    return {
      points,
      times,
      duration: Math.max(MIN_HOP_DURATION, computeTotalDistance(points) * HOP_SPEED_FACTOR),
      impactRatio: Math.min(times[path.captureIndexInHop] ?? 0.5, MAX_IMPACT_RATIO),
      yOffsets: times.map(t => -JUMP_HEIGHT * Math.sin(Math.PI * t)),
    };
  }, [path]);

  const runCapture = useCallback((move: SurakartaMove) => {
    const p = getMovePath(move);
    setSelected(null);
    setImpacted(false);
    setPendingMove(move);
    setAnimPhase(p?.slidePoints ? 'slide' : 'jump');
  }, []);

  const finishCapture = useCallback(() => {
    if (!pendingMove) return;
    const move = pendingMove;
    setState(s => applyMove(s, move));
    setPendingMove(null);
    setAnimPhase(null);
    setImpacted(false);
  }, [pendingMove]);

  // Impacto sincronizado com o salto; o cleanup cobre restart e unmount.
  useEffect(() => {
    if (animPhase !== 'jump' || !hopInfo) return;
    const t = setTimeout(() => setImpacted(true), hopInfo.duration * hopInfo.impactRatio * 1000);
    return () => clearTimeout(t);
  }, [animPhase, hopInfo]);

  // Turno da IA
  useEffect(() => {
    if (!isThinking || animPhase !== null) return;
    let active = true;
    const myGen = gen.current;

    askSurakartaAI(state, difficulty).then(aiMove => {
      if (!active || myGen !== gen.current) return;
      // Fallback: se o worker falhar, joga um lance aleatório em vez de travar.
      const move = aiMove ?? legalMoves[Math.floor(Math.random() * legalMoves.length)];
      if (!move) return;
      if (move.isCapture) runCapture(move);
      else setState(s => applyMove(s, move));
    });

    return () => { active = false; };
  }, [state, isThinking, animPhase, difficulty, legalMoves, runCapture]);

  const restart = () => {
    gen.current++;
    resetSurakartaAI();
    setState(newSurakartaGame());
    setSelected(null);
    setPendingMove(null);
    setAnimPhase(null);
    setImpacted(false);
  };

  const onNodeClick = (x: number, y: number) => {
    if (state.winner !== null || animPhase !== null || isThinking) return;

    const key = `${x},${y}`;
    const move = selected ? destinations.get(key) : undefined;
    if (move) {
      if (move.isCapture) runCapture(move);
      else {
        setState(s => applyMove(s, move));
        setSelected(null);
      }
      return;
    }

    if (state.board[y][x] === state.turn && movable.has(key)) {
      setSelected(s => (s?.x === x && s?.y === y ? null : { x, y }));
    } else {
      setSelected(null);
    }
  };

  const movingColor = pendingMove && state.board[pendingMove.fromY][pendingMove.fromX] === -1 ? '#e8dcc4' : '#3a2218';

  const resultText =
    state.winner === 0
      ? END_MESSAGES[state.endReason ?? 'repetition']
      : `${state.winner === 1 ? 'Pretas' : 'Brancas'} Venceram!${
          state.endReason === 'stalemate' ? ` (${END_MESSAGES.stalemate})` : ''
        }`;

  return (
    <div className="flex flex-col items-center justify-between h-[100dvh] w-screen bg-[#e8dcc4] p-3 md:p-6 overflow-hidden relative font-sans select-none">
      <div className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply opacity-40" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      <div className="z-10 flex w-full max-w-[500px] items-center justify-between gap-2 shrink-0 py-1">
        <Link href="/" className="flex items-center gap-1.5 rounded-xl border-4 border-[#3a2218] bg-[#fdf8ef] px-3 py-1.5 text-xs font-black uppercase tracking-widest text-[#3a2218] shadow-[3px_3px_0_#3a2218] hover:-translate-y-0.5 transition-all">
          <ArrowLeft size={16} strokeWidth={3} /> Sair
        </Link>

        <div className="flex items-center gap-2 rounded-full border-4 border-[#3a2218] bg-[#fdf8ef] px-4 py-1 shadow-[3px_3px_0_#3a2218]">
          {isThinking ? (
            <>
              <Cpu size={16} className="text-[#c49a6c] animate-pulse" />
              <span className="text-xs md:text-sm font-black uppercase tracking-widest text-[#c49a6c]">IA Pensando...</span>
            </>
          ) : (
            <span className="text-xs md:text-sm font-black uppercase tracking-widest text-[#3a2218]">
              {state.turn === 1 ? 'Turno das Pretas' : 'Turno das Brancas'}
            </span>
          )}
        </div>

        <button onClick={restart} aria-label="Reiniciar partida" className="flex items-center justify-center rounded-xl border-4 border-[#3a2218] bg-[#c49a6c] px-3 py-1.5 text-[#3a2218] shadow-[3px_3px_0_#3a2218] hover:-translate-y-0.5 transition-all outline-none">
          <RotateCcw size={16} strokeWidth={3} />
        </button>
      </div>

      <div className="relative z-10 my-auto shrink-0 w-full" style={{ containerType: 'size', height: 'min(70vh, 100vw)', aspectRatio: '1/1' }}>
        <div className="absolute inset-0 mx-auto rounded-2xl border-8 border-[#3a2218] bg-[#fdf8ef] shadow-[8px_8px_0_#3a2218] overflow-hidden" style={{ aspectRatio: '1/1', height: '100%' }}>

          <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {BOARD_POINTS.map((val, i) => {
              const inner = i === 1 || i === 4;
              const outer = i === 2 || i === 3;
              const stroke = inner ? '#0ea5e9' : outer ? '#1d4ed8' : '#16a34a';
              const width = inner || outer ? '1.8' : '1.2';
              return (
                <React.Fragment key={`grid-${i}`}>
                  <line x1={BOARD_POINTS[0]} y1={val} x2={BOARD_POINTS[5]} y2={val} stroke={stroke} strokeWidth={width} strokeLinecap="round" />
                  <line x1={val} y1={BOARD_POINTS[0]} x2={val} y2={BOARD_POINTS[5]} stroke={stroke} strokeWidth={width} strokeLinecap="round" />
                </React.Fragment>
              );
            })}
            {DECORATIVE_LOOPS.map((loop, i) => (
              <path key={`loop-${i}`} d={loop.path} fill="none" stroke={loop.size === 'small' ? '#0ea5e9' : '#1d4ed8'} strokeWidth="1.8" strokeLinecap="round" />
            ))}
          </svg>

          {/* Fase 1: deslize pelos trilhos até a casa anterior ao alvo */}
          {pendingMove && animPhase === 'slide' && slideInfo && (
            <motion.div
              key={`slide-${state.history.length}`}
              className="absolute z-30 h-7 w-7 md:h-8 md:w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#3a2218] shadow-md pointer-events-none"
              style={{ backgroundColor: movingColor }}
              initial={{ left: `${slideInfo.points[0].x}%`, top: `${slideInfo.points[0].y}%` }}
              animate={{
                left: slideInfo.points.map(p => `${p.x}%`),
                top: slideInfo.points.map(p => `${p.y}%`),
              }}
              transition={{ duration: slideInfo.duration, times: slideInfo.times, ease: 'linear' }}
              onAnimationComplete={() => setAnimPhase('jump')}
            />
          )}

          {/* Fase 2: salto sobre o alvo */}
          {pendingMove && animPhase === 'jump' && hopInfo && (
            <motion.div
              key={`hop-${state.history.length}`}
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              initial={{ left: `${hopInfo.points[0].x}%`, top: `${hopInfo.points[0].y}%` }}
              animate={{
                left: hopInfo.points.map(p => `${p.x}%`),
                top: hopInfo.points.map(p => `${p.y}%`),
              }}
              transition={{ duration: hopInfo.duration, times: hopInfo.times, ease: 'linear' }}
              onAnimationComplete={finishCapture}
            >
              <motion.div
                className="h-7 w-7 md:h-8 md:w-8 rounded-full border-[3px] border-[#3a2218] shadow-md"
                style={{ backgroundColor: movingColor }}
                initial={{ y: hopInfo.yOffsets[0], scale: 1 }}
                animate={{ y: hopInfo.yOffsets, scale: [1, 1.15, 1] }}
                transition={{ duration: hopInfo.duration, times: hopInfo.times, ease: 'linear' }}
              />
            </motion.div>
          )}

          <AnimatePresence>
            {pendingMove && impacted && animPhase !== null && pendingMove.capturedX !== undefined && (
              <motion.div
                key="impact-fx"
                className="absolute z-25 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full border-4 border-rose-500"
                style={{ left: `${BOARD_POINTS[pendingMove.capturedX]}%`, top: `${BOARD_POINTS[pendingMove.capturedY!]}%` }}
                initial={{ width: 10, height: 10, opacity: 0.9 }}
                animate={{ width: 44, height: 44, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>

          {state.board.map((row, y) =>
            row.map((piece, x) => {
              const key = `${x},${y}`;
              const isSelected = selected?.x === x && selected?.y === y;
              const isHidden = !!pendingMove && (
                (pendingMove.fromX === x && pendingMove.fromY === y) ||
                (impacted && pendingMove.capturedX === x && pendingMove.capturedY === y)
              );
              const destMove = destinations.get(key);
              const isCaptureTarget = capturedTargets.has(key);
              const canSelect = piece === state.turn && movable.has(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onNodeClick(x, y)}
                  aria-label={`Casa ${x + 1},${y + 1}${piece === 1 ? ', peça preta' : piece === -1 ? ', peça branca' : ''}`}
                  aria-pressed={isSelected}
                  className="absolute flex h-9 w-9 md:h-11 md:w-11 items-center justify-center outline-none -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${BOARD_POINTS[x]}%`, top: `${BOARD_POINTS[y]}%` }}
                >
                  <span className="absolute z-0 h-2 w-2 rounded-full border-2 border-[#3a2218] bg-[#b0b0b0]" />

                  {destMove && (
                    <span className={`absolute z-10 h-10 w-10 md:h-12 md:w-12 animate-pulse rounded-full border-[4px] ${destMove.isCapture ? 'border-rose-500 bg-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'border-emerald-600 bg-emerald-500/20'}`} />
                  )}

                  {isCaptureTarget && !destMove && (
                    <span className="absolute z-10 h-10 w-10 md:h-12 md:w-12 animate-pulse rounded-full border-[4px] border-rose-500/80" />
                  )}

                  <AnimatePresence>
                    {piece !== 0 && !isHidden && (
                      <motion.span
                        key={`piece-${key}`}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: isSelected ? 1.15 : 1, opacity: 1 }}
                        exit={{ scale: 0.15, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={`absolute z-20 h-7 w-7 md:h-8 md:w-8 rounded-full border-[3px] border-[#3a2218] shadow-sm ${
                          piece === 1 ? 'bg-[#3a2218]' : 'bg-[#e8dcc4]'
                        } ${isSelected ? 'ring-4 ring-amber-400' : ''} ${
                          canSelect && !selected ? 'ring-2 ring-[#3a2218]/30 ring-offset-2' : ''
                        }`}
                      />
                    )}
                  </AnimatePresence>
                </button>
              );
            })
          )}
        </div>
      </div>

      <AnimatePresence>
        {state.winner !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm rounded-3xl border-8 border-[#3a2218] bg-[#fdf8ef] p-8 text-center shadow-[12px_12px_0_#1a0e06]">
              {state.winner === 0 ? (
                <AlertTriangle size={64} className="mx-auto mb-4 text-[#7d7d7d]" />
              ) : (
                <Trophy size={64} className="mx-auto mb-4 text-[#c49a6c]" />
              )}

              <h2 className="mb-2 text-3xl font-black uppercase tracking-widest text-[#3a2218]">
                {state.winner === 0 ? 'Empate' : 'Fim de jogo'}
              </h2>

              <p className="mb-8 text-lg font-black uppercase tracking-widest text-[#3a2218]">{resultText}</p>

              <div className="flex flex-col gap-3">
                <button onClick={restart} className="w-full rounded-xl border-4 border-[#3a2218] bg-[#c49a6c] py-3.5 font-black uppercase tracking-widest text-[#3a2218] shadow-[4px_4px_0_#3a2218] outline-none">
                  Revanche
                </button>
                <Link href="/" className="block w-full rounded-xl border-4 border-[#3a2218] bg-[#fdf8ef] py-3.5 font-black uppercase tracking-widest text-[#3a2218] shadow-[4px_4px_0_#3a2218]">
                  Sair
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
