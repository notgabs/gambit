'use client';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Trophy, AlertTriangle } from 'lucide-react';
import { newSurakartaGame, applyMove, generateLegalMoves } from '@/lib/engine/surakarta';
import type { SurakartaState, SurakartaMove } from '@/types/surakarta';

export default function SurakartaBoard() {
  const [state, setState] = useState<SurakartaState>(() => newSurakartaGame());
  const [selected, setSelected] = useState<{ x: number, y: number } | null>(null);
  const [animatingCapture, setAnimatingCapture] = useState<SurakartaMove | null>(null);

  const restart = () => {
    setState(newSurakartaGame());
    setSelected(null);
    setAnimatingCapture(null);
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

  const onNodeClick = (x: number, y: number) => {
    if (state.winner !== null || animatingCapture) return;

    const destKey = `${x},${y}`;
    if (selected !== null && destinations.has(destKey)) {
      const move = destinations.get(destKey)!;
      if (move.isCapture && move.path) {
        setAnimatingCapture(move);
        setSelected(null);
        setTimeout(() => {
          setState(s => applyMove(s, move));
          setAnimatingCapture(null);
        }, 1500);
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

  // Coordenadas SVG
  const P = [15, 29, 43, 57, 71, 85];

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
            {/* Grid 6x6 Lines */}
            {P.map((val, i) => (
              <React.Fragment key={`grid-${i}`}>
                <line x1={P[0]} y1={val} x2={P[5]} y2={val} stroke="#3a2218" strokeWidth="1.2" strokeLinecap="round" />
                <line x1={val} y1={P[0]} x2={val} y2={P[5]} stroke="#3a2218" strokeWidth="1.2" strokeLinecap="round" />
              </React.Fragment>
            ))}

            {/* Espirais (Loops) */}
            <path d="M 15 29 A 14 14 0 1 1 29 15" fill="none" stroke="#3a2218" strokeWidth="1.2" /> {/* TL Outer */}
            <path d="M 15 43 A 28 28 0 1 1 43 15" fill="none" stroke="#3a2218" strokeWidth="1.2" /> {/* TL Inner */}
            
            <path d="M 71 15 A 14 14 0 1 1 85 29" fill="none" stroke="#3a2218" strokeWidth="1.2" /> {/* TR Outer */}
            <path d="M 57 15 A 28 28 0 1 1 85 43" fill="none" stroke="#3a2218" strokeWidth="1.2" /> {/* TR Inner */}

            <path d="M 29 85 A 14 14 0 1 1 15 71" fill="none" stroke="#3a2218" strokeWidth="1.2" /> {/* BL Outer */}
            <path d="M 43 85 A 28 28 0 1 1 15 57" fill="none" stroke="#3a2218" strokeWidth="1.2" /> {/* BL Inner */}

            <path d="M 85 71 A 14 14 0 1 1 71 85" fill="none" stroke="#3a2218" strokeWidth="1.2" /> {/* BR Outer */}
            <path d="M 85 57 A 28 28 0 1 1 57 85" fill="none" stroke="#3a2218" strokeWidth="1.2" /> {/* BR Inner */}

            {/* Peça Animada na Captura */}
            {animatingCapture && animatingCapture.path && (
              <g>
                <path id="capturePath" d={animatingCapture.path} fill="none" stroke="transparent" />
                <circle r="4" fill={state.turn === 1 ? '#3a2218' : '#e8dcc4'} stroke="#3a2218" strokeWidth="0.8">
                  <animateMotion dur="1.5s" repeatCount="1" fill="freeze" calcMode="linear">
                    <mpath href="#capturePath" />
                  </animateMotion>
                </circle>
              </g>
            )}
          </svg>

          {/* Nós e Peças */}
          {Array.from({ length: 6 }).map((_, y) => 
            Array.from({ length: 6 }).map((_, x) => {
              const piece = state.board[y][x];
              const isSelected = selected?.x === x && selected?.y === y;
              const isHidden = animatingCapture && animatingCapture.fromX === x && animatingCapture.fromY === y;
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
                  style={{ left: `${P[x]}%`, top: `${P[y]}%` }}
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
