'use client';
import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Trophy, AlertTriangle } from 'lucide-react';
import {
  newSurakartaGame,
  applyMove,
  generateLegalMoves,
  getDecorativeLoops,
  BOARD_POINTS,
} from '@/lib/engine/surakarta';
import type { SurakartaState, SurakartaMove } from '@/types/surakarta';

const JUMP_DURATION = 0.4;          // duração do salto final (s)
const SPEED_FACTOR = 0.012;         // segundos por "unidade de distância" no deslize
const MIN_SLIDE_DURATION = 0.35;

function computeTimes(points: { x: number; y: number }[]): number[] {
  if (points.length <= 1) return [0, 1];
  const acc = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    total += Math.sqrt(dx * dx + dy * dy);
    acc.push(total);
  }
  if (total === 0) return points.map((_, i) => i / (points.length - 1));
  return acc.map(d => d / total);
}

function computeTotalDistance(points: { x: number; y: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

const DECORATIVE_LOOPS = getDecorativeLoops();

export default function SurakartaBoard() {
  const [state, setState] = useState<SurakartaState>(() => newSurakartaGame());
  const [selected, setSelected] = useState<{ x: number, y: number } | null>(null);

  const [pendingMove, setPendingMove] = useState<SurakartaMove | null>(null);
  const [animPhase, setAnimPhase] = useState<'slide' | 'jump' | null>(null);

  const slideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jumpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAnimTimers = () => {
    if (slideTimeoutRef.current) clearTimeout(slideTimeoutRef.current);
    if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
    slideTimeoutRef.current = null;
    jumpTimeoutRef.current = null;
  };

  const restart = () => {
    clearAnimTimers();
    setState(newSurakartaGame());
    setSelected(null);
    setPendingMove(null);
    setAnimPhase(null);
  };

  const legalMoves = useMemo(() => generateLegalMoves(state), [state]);

  const destinations = useMemo(() => {
    const map = new Map<string, SurakartaMove>();
    if (!selected) return map;
    for (const m of legalMoves) {
      if (m.fromX === selected.x && m.fromY === selected.y) {
        map.set(`${m.toX},${m.toY}`, m);
      }
    }
    return map;
  }, [selected, legalMoves]);

  const movable = useMemo(() => {
    const s = new Set<string>();
    for (const m of legalMoves) s.add(`${m.fromX},${m.fromY}`);
    return s;
  }, [legalMoves]);

  const slideInfo = useMemo(() => {
    if (!pendingMove?.slidePoints || pendingMove.slidePoints.length === 0) return null;
    const points = pendingMove.slidePoints;
    const distance = computeTotalDistance(points);
    const duration = Math.max(MIN_SLIDE_DURATION, distance * SPEED_FACTOR);
    const times = computeTimes(points);
    return { points, duration, times };
  }, [pendingMove]);

  const runCapture = (move: SurakartaMove) => {
    setSelected(null);
    setPendingMove(move);

    const points = move.slidePoints ?? [];
    const distance = computeTotalDistance(points);
    const slideDuration = Math.max(MIN_SLIDE_DURATION, distance * SPEED_FACTOR);

    const finish = () => {
      setState(s => applyMove(s, move));
      setPendingMove(null);
      setAnimPhase(null);
    };

    const hasSlide = points.length > 1;

    if (move.hasFinalHop) {
      if (hasSlide) {
        setAnimPhase('slide');
        slideTimeoutRef.current = setTimeout(() => {
          setAnimPhase('jump');
          jumpTimeoutRef.current = setTimeout(finish, JUMP_DURATION * 1000);
        }, slideDuration * 1000);
      } else {
        setAnimPhase('jump');
        jumpTimeoutRef.current = setTimeout(finish, JUMP_DURATION * 1000);
      }
    } else {
      setAnimPhase('slide');
      slideTimeoutRef.current = setTimeout(finish, slideDuration * 1000);
    }
  };

  const onNodeClick = (x: number, y: number) => {
    if (state.winner !== null || animPhase !== null) return;

    const destKey = `${x},${y}`;
    if (selected !== null && destinations.has(destKey)) {
      const move = destinations.get(destKey)!;
      if (move.isCapture) {
        runCapture(move);
      } else {
        setState(s => applyMove(s, move));
        setSelected(null);
      }
      return;
    }

    if (state.board[y][x] === state.turn && movable.has(destKey)) {
      setSelected(s => (s?.x === x && s?.y === y ? null : { x, y }));
    } else {
      setSelected(null);
    }
  };

  const movingColor = pendingMove
    ? (state.board[pendingMove.fromY][pendingMove.fromX] === 1 ? '#3a2218' : '#e8dcc4')
    : '#3a2218';

  return (
    <div className="flex flex-col items-center justify-between h-[100dvh] w-screen bg-[#e8dcc4] p-3 md:p-6 overflow-hidden relative font-sans select-none">
      <div className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply opacity-40" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      <div className="z-10 flex w-full max-w-[500px] items-center justify-between gap-2 shrink-0 py-1">
        <a href="/" className="flex items-center gap-1.5 rounded-xl border-4 border-[#3a2218] bg-[#fdf8ef] px-3 py-1.5 text-xs font-black uppercase tracking-widest text-[#3a2218] shadow-[3px_3px_0_#3a2218] hover:-translate-y-0.5 transition-all">
          <ArrowLeft size={16} strokeWidth={3} /> Sair
        </a>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 rounded-full border-4 border-[#3a2218] bg-[#fdf8ef] px-4 py-1 shadow-[3px_3px_0_#3a2218]">
            <span className="text-xs md:text-sm font-black uppercase tracking-widest text-[#3a2218]">
              {state.turn === 1 ? 'Turno das Pretas' : 'Turno das Brancas'}
            </span>
          </div>
        </div>

        <button onClick={restart} className="flex items-center justify-center rounded-xl border-4 border-[#3a2218] bg-[#c49a6c] px-3 py-1.5 text-[#3a2218] shadow-[3px_3px_0_#3a2218] hover:-translate-y-0.5 transition-all outline-none">
          <RotateCcw size={16} strokeWidth={3} />
        </button>
      </div>

      <div className="relative z-10 my-auto shrink-0 w-full" style={{ containerType: 'size', height: 'min(70vh, 100vw)', aspectRatio: '1/1' }}>
        <div className="absolute inset-0 mx-auto rounded-2xl border-8 border-[#3a2218] bg-[#fdf8ef] shadow-[8px_8px_0_#3a2218] overflow-hidden" style={{ aspectRatio: '1/1', height: '100%' }}>

          <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {BOARD_POINTS.map((val, i) => (
              <React.Fragment key={`grid-${i}`}>
                <line x1={BOARD_POINTS[0]} y1={val} x2={BOARD_POINTS[5]} y2={val} stroke="#3a2218" strokeWidth="1.2" strokeLinecap="round" />
                <line x1={val} y1={BOARD_POINTS[0]} x2={val} y2={BOARD_POINTS[5]} stroke="#3a2218" strokeWidth="1.2" strokeLinecap="round" />
              </React.Fragment>
            ))}

            {DECORATIVE_LOOPS.map((loop, i) => (
              <path
                key={`loop-${i}`}
                d={loop.path}
                fill="none"
                stroke={loop.size === 'small' ? '#9333ea' : '#ec4899'}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Fase 1: deslize pelos trilhos/loops (Framer Motion, sem SMIL) */}
          {pendingMove && animPhase === 'slide' && slideInfo && (
            <motion.div
              key={`slide-${pendingMove.fromX}-${pendingMove.fromY}-${pendingMove.toX}-${pendingMove.toY}-${state.history.length}`}
              className="absolute z-30 h-7 w-7 md:h-8 md:w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#3a2218] shadow-md pointer-events-none"
              style={{ backgroundColor: movingColor }}
              initial={{
                left: `${slideInfo.points[0].x}%`,
                top: `${slideInfo.points[0].y}%`,
              }}
              animate={{
                left: slideInfo.points.map(p => `${p.x}%`),
                top: slideInfo.points.map(p => `${p.y}%`),
              }}
              transition={{
                duration: slideInfo.duration,
                times: slideInfo.times,
                ease: 'linear',
              }}
            />
          )}

          {/* Fase 2: salto final da captura */}
          {pendingMove && animPhase === 'jump' && (
            <motion.div
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              initial={{
                left: `${BOARD_POINTS[pendingMove.preCaptureX ?? pendingMove.fromX]}%`,
                top: `${BOARD_POINTS[pendingMove.preCaptureY ?? pendingMove.fromY]}%`,
              }}
              animate={{
                left: `${BOARD_POINTS[pendingMove.toX]}%`,
                top: `${BOARD_POINTS[pendingMove.toY]}%`,
              }}
              transition={{ duration: JUMP_DURATION, ease: 'easeInOut' }}
            >
              <motion.div
                className="h-7 w-7 md:h-8 md:w-8 rounded-full border-[3px] border-[#3a2218] shadow-md"
                style={{ backgroundColor: movingColor }}
                animate={{ y: [0, -22, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: JUMP_DURATION, ease: 'easeOut' }}
              />
            </motion.div>
          )}

          {Array.from({ length: 6 }).map((_, y) =>
            Array.from({ length: 6 }).map((_, x) => {
              const piece = state.board[y][x];
              const isSelected = selected?.x === x && selected?.y === y;

              const isHidden = !!pendingMove && (
                (pendingMove.fromX === x && pendingMove.fromY === y) ||
                (animPhase === 'jump' && pendingMove.toX === x && pendingMove.toY === y)
              );

              const destMove = destinations.get(`${x},${y}`);
              const isDest = destMove !== undefined;
              const isCapture = destMove?.isCapture;
              const canSelect = piece === state.turn && movable.has(`${x},${y}`);

              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  onClick={() => onNodeClick(x, y)}
                  className="absolute flex h-9 w-9 md:h-11 md:w-11 items-center justify-center outline-none -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${BOARD_POINTS[x]}%`, top: `${BOARD_POINTS[y]}%` }}
                >
                  <span className="absolute z-0 h-2 w-2 rounded-full border-2 border-[#3a2218] bg-[#b0b0b0]" />

                  {isDest && (
                    <span className={`absolute z-10 h-10 w-10 md:h-12 md:w-12 animate-pulse rounded-full border-[4px] ${isCapture ? 'border-rose-500 bg-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'border-emerald-600 bg-emerald-500/20'}`} />
                  )}

                  <AnimatePresence>
                    {piece !== 0 && !isHidden && (
                      <motion.span
                        key={`piece-${x}-${y}`}
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

              <p className={`mb-8 text-lg font-black uppercase tracking-widest text-[#3a2218]`}>
                {state.winner === 0
                  ? 'Estagnação!'
                  : state.winner === 1 ? 'Pretas Venceram!' : 'Brancas Venceram!'}
              </p>

              <div className="flex flex-col gap-3">
                <button onClick={restart} className="w-full rounded-xl border-4 border-[#3a2218] bg-[#c49a6c] py-3.5 font-black uppercase tracking-widest text-[#3a2218] shadow-[4px_4px_0_#3a2218] outline-none">
                  Revanche
                </button>
                <a href="/" className="block w-full rounded-xl border-4 border-[#3a2218] bg-[#fdf8ef] py-3.5 font-black uppercase tracking-widest text-[#3a2218] shadow-[4px_4px_0_#3a2218]">
                  Sair
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
