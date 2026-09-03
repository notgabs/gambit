'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Trophy, Cpu, AlertTriangle } from 'lucide-react';
import { newAdugoGame, applyMove, COORDS, LINES } from '@/lib/engine/adugo';
import { askAdugoAI, resetAdugoAI } from '@/lib/ai/askAdugoAI';
import type { AdugoDifficulty } from '@/lib/ai/adugoAI';
import type { AdugoState, AdugoMove } from '@/types/adugo';

function buildDogIds(board: AdugoState['board']) {
  const map: Record<number, string> = {};
  let n = 0;
  board.forEach((c, i) => { if (c === -1) map[i] = `dog-${++n}`; });
  return map;
}

export default function AdugoBoard() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'ai' ? 'ai' : 'offline';
  const difficulty = (searchParams.get('difficulty') || 'medio') as AdugoDifficulty;
  const humanPlayer: 1 | -1 = searchParams.get('side') === 'cao' ? -1 : 1;
  const aiPlayer = humanPlayer === 1 ? -1 : 1;

  const [state, setState] = useState<AdugoState>(() => newAdugoGame());
  const [selected, setSelected] = useState<number | null>(null);
  const [dogIds, setDogIds] = useState(() => buildDogIds(newAdugoGame().board));
  
  // Contador de geração para impedir concorrência e o bug do Strict Mode (que jogava o 1º lance 2x)
  const gen = useRef(0);
  const isThinking = mode === 'ai' && state.turn === aiPlayer && state.winner === null;

  const restart = () => {
    gen.current++;
    resetAdugoAI();
    const fresh = newAdugoGame();
    setState(fresh);
    setSelected(null);
    setDogIds(buildDogIds(fresh.board));
  };

  useEffect(() => {
    if (!isThinking) return;
    
    let active = true;
    const myGen = gen.current;

    askAdugoAI(state, difficulty).then(aiMove => {
      if (!active || myGen !== gen.current) return;
      if (aiMove) {
        setDogIds(prev => {
          const next = { ...prev };
          if (aiMove.capture !== undefined) delete next[aiMove.capture];
          if (state.board[aiMove.from] === -1) {
            const id = next[aiMove.from];
            delete next[aiMove.from];
            if (id) next[aiMove.to] = id;
          }
          return next;
        });
        setState(s => applyMove(s, aiMove));
      }
    });

    return () => { active = false; };
  }, [state, isThinking, difficulty]);

  useEffect(() => {
    if (state.winner !== null) {
      if (state.winner === 1) {
        new Audio('/onca.mp3').play().catch(() => {});
      } else if (state.winner === -1) {
        new Audio('/caes.mp3').play().catch(() => {});
      }
    }
  }, [state.winner]);

  const destinations = useMemo(() => {
    const map = new Map<number, AdugoMove>();
    if (selected === null) return map;
    for (const m of state.legalMoves) {
      if (m.from === selected) map.set(m.to, m);
    }
    return map;
  }, [selected, state.legalMoves]);

  const movable = useMemo(() => {
    const s = new Set<number>();
    for (const m of state.legalMoves) s.add(m.from);
    return s;
  }, [state.legalMoves]);

  const playMove = (move: AdugoMove) => {
    setDogIds(prev => {
      const next = { ...prev };
      if (move.capture !== undefined) delete next[move.capture];
      if (state.board[move.from] === -1) {
        const id = next[move.from];
        delete next[move.from];
        if (id) next[move.to] = id;
      }
      return next;
    });
    setState(s => applyMove(s, move));
    setSelected(null);
  };

  const onNodeClick = (i: number) => {
    if (state.winner !== null || isThinking) return;

    if (selected !== null && destinations.has(i)) {
      playMove(destinations.get(i)!);
      return;
    }

    if (state.board[i] === state.turn && movable.has(i)) {
      setSelected(s => (s === i ? null : i));
    } else {
      setSelected(null);
    }
  };

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
              {state.turn === 1 ? 'Vez da Onça' : 'Vez da Matilha'}
            </span>
            <div className="flex gap-0.5 ml-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-2.5 w-2.5 rounded-full border border-[#3a2218] ${i < state.dogsCaptured ? 'bg-[#e11d48]' : 'bg-[#e8dcc4]'}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#3a2218]/60">
              Passos: {state.pliesWithoutCapture}/60
            </span>
          </div>
        </div>

        <button onClick={restart} className="flex items-center justify-center rounded-xl border-4 border-[#3a2218] bg-[#c49a6c] px-3 py-1.5 text-[#3a2218] shadow-[3px_3px_0_#3a2218] hover:-translate-y-0.5 transition-all outline-none">
          <RotateCcw size={16} strokeWidth={3} />
        </button>
      </div>

      {/* CSS Container Queries para manter o tabuleiro responsivo sem quebrar layout */}
      <div className="relative z-10 my-auto shrink-0 w-full" style={{ containerType: 'size', height: 'min(70vh, calc(100vw * 140 / 100))', aspectRatio: '100/140' }}>
        <div className="absolute inset-0 mx-auto rounded-2xl border-8 border-[#3a2218] bg-[#fdf8ef] shadow-[8px_8px_0_#3a2218] overflow-hidden" style={{ aspectRatio: '100/140', height: '100%' }}>
          <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 140" preserveAspectRatio="none">
            {LINES.map(([a, b], idx) => (
              <line key={idx} x1={COORDS[a].x} y1={COORDS[a].y} x2={COORDS[b].x} y2={COORDS[b].y} stroke="#3a2218" strokeWidth="1.2" strokeLinecap="round" />
            ))}
            <rect x="10" y="10" width="80" height="80" fill="none" stroke="#3a2218" strokeWidth="2.5" />
            
            {/* Sombreamento da Toca */}
            <polygon points="50,90 10,130 90,130" fill="#3a2218" opacity="0.05" />
          </svg>

          {COORDS.map((c, i) => {
            const piece = state.board[i];
            const isSelected = selected === i;
            const destMove = destinations.get(i);
            const isDest = destMove !== undefined;
            const isCapture = destMove?.capture !== undefined;
            const canSelect = piece === state.turn && movable.has(i);

            return (
              <button
                key={i}
                type="button"
                onClick={() => onNodeClick(i)}
                className="absolute flex h-9 w-9 md:h-11 md:w-11 items-center justify-center outline-none -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${c.x}%`, top: `${(c.y / 140) * 100}%` }}
              >
                <span className="absolute z-0 h-2.5 w-2.5 rounded-full border-2 border-[#3a2218] bg-[#b0b0b0]" />

                {isDest && (
                  <span className={`absolute z-10 h-7 w-7 animate-pulse rounded-full border-[3px] ${isCapture ? 'border-rose-500 bg-rose-500/30' : 'border-emerald-600 bg-emerald-500/20'}`} />
                )}

                <AnimatePresence>
                  {piece !== 0 && (
                    <motion.span
                      key={piece === 1 ? 'onca' : dogIds[i] || `d-${i}`}
                      layoutId={piece === 1 ? 'onca' : dogIds[i] || `d-${i}`}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: isSelected ? 1.15 : 1, opacity: 1 }}
                      exit={{ scale: 0.15, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute z-20 h-7 w-7 md:h-8 md:w-8 rounded-full border-[3px] border-[#3a2218] shadow-sm ${
                        piece === 1 ? 'bg-[#f0c33c]' : 'bg-[#7d7d7d]'
                      } ${isSelected ? 'ring-4 ring-amber-400' : ''} ${
                        canSelect && selected === null ? 'ring-2 ring-[#3a2218]/30 ring-offset-2' : ''
                      }`}
                    />
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>

      {isThinking && (
        <div className="absolute top-[4.5rem] flex items-center gap-2 bg-[#fdf8ef] border-4 border-[#3a2218] px-4 py-2 rounded-full shadow-[4px_4px_0_#3a2218] z-20 font-black text-[#3a2218] uppercase tracking-widest text-xs animate-bounce">
          <Cpu size={14} /> IA Pensando...
        </div>
      )}

      {/* Modal Fim de Jogo */}
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
              
              <p className={`mb-8 text-lg font-black uppercase tracking-widest ${state.winner === 1 ? 'text-[#c49a6c]' : 'text-[#3a2218]'}`}>
                {state.winner === 0 
                  ? 'A partida estagnou!' 
                  : state.winner === 1 
                    ? (mode === 'ai' ? (humanPlayer === 1 ? 'Você Venceu!' : 'IA Venceu!') : 'A Onça Venceu!')
                    : (mode === 'ai' ? (humanPlayer === -1 ? 'Você Venceu!' : 'IA Venceu!') : 'Os Cães Venceram!')}
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
