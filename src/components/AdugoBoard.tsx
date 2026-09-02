'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Trophy, Cpu } from 'lucide-react';
import { newAdugoGame, applyMove, LINES } from '@/lib/engine/adugo';
import { askAdugoAI } from '@/lib/ai/askAdugoAI';
import type { AdugoDifficulty } from '@/lib/ai/adugoAI';
import type { AdugoState, AdugoMove } from '@/types/adugo';

// Coordenadas Alinhadas em Espaço 100x140
// Isso cria a malha 5x5 perfeitamente quadrada e a Toca como um triângulo pontudo embaixou.
const COORDS = [
  // Grid 5x5 perfeitamente quadrado (step de 20 no X e no Y)
  { x: 10, y: 10 }, { x: 30, y: 10 }, { x: 50, y: 10 }, { x: 70, y: 10 }, { x: 90, y: 10 },
  { x: 10, y: 30 }, { x: 30, y: 30 }, { x: 50, y: 30 }, { x: 70, y: 30 }, { x: 90, y: 30 },
  { x: 10, y: 50 }, { x: 30, y: 50 }, { x: 50, y: 50 }, { x: 70, y: 50 }, { x: 90, y: 50 },
  { x: 10, y: 70 }, { x: 30, y: 70 }, { x: 50, y: 70 }, { x: 70, y: 70 }, { x: 90, y: 70 },
  { x: 10, y: 90 }, { x: 30, y: 90 }, { x: 50, y: 90 }, { x: 70, y: 90 }, { x: 90, y: 90 },
  // Toca (Triângulo estendendo-se para a base X=[30, 50, 70])
  { x: 40, y: 110 }, { x: 50, y: 110 }, { x: 60, y: 110 }, // Linha média (metade do caminho X e Y)
  { x: 30, y: 130 }, { x: 50, y: 130 }, { x: 70, y: 130 }, // Base alinhada com as colunas 2, 3 e 4
];

function buildDogIds(board: AdugoState['board']) {
  const map: Record<number, string> = {};
  let n = 0;
  board.forEach((c, i) => {
    if (c === -1) map[i] = `dog-${++n}`;
  });
  return map;
}

export default function AdugoBoard() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'ai' ? 'ai' : 'offline';
  const difficulty = (searchParams.get('difficulty') || 'medio') as AdugoDifficulty;
  const sideParam = searchParams.get('side');

  const humanPlayer: 1 | -1 = sideParam === 'cao' ? -1 : 1;
  const aiPlayer: 1 | -1 = humanPlayer === 1 ? -1 : 1;

  const [state, setState] = useState<AdugoState>(() => newAdugoGame());
  const [selected, setSelected] = useState<number | null>(null);
  const [dogIds, setDogIds] = useState(() => buildDogIds(newAdugoGame().board));
  const [isThinking, setIsThinking] = useState(false);

  const busyRef = useRef(false);

  const restart = () => {
    const fresh = newAdugoGame();
    setState(fresh);
    setSelected(null);
    setDogIds(buildDogIds(fresh.board));
    setIsThinking(false);
    busyRef.current = false;
  };

  // Turno da IA
  useEffect(() => {
    if (mode !== 'ai' || state.winner !== null || state.turn !== aiPlayer) return;
    if (busyRef.current) return;

    let active = true;

    const runAI = async () => {
      busyRef.current = true;
      setIsThinking(true);

      try {
        const delay = difficulty === 'dificil' ? 300 : 550;
        const [aiMove] = await Promise.all([
          askAdugoAI(state, difficulty),
          new Promise((r) => setTimeout(r, delay)),
        ]);

        if (active && aiMove) {
          setDogIds((prev) => {
            const next = { ...prev };
            if (aiMove.capture !== undefined) delete next[aiMove.capture];
            if (state.board[aiMove.from] === -1) {
              const id = next[aiMove.from];
              delete next[aiMove.from];
              if (id) next[aiMove.to] = id;
            }
            return next;
          });
          setState((prev) => applyMove(prev, aiMove));
        }
      } catch (err) {
        console.error('AI Error:', err);
      } finally {
        if (active) {
          setIsThinking(false);
          busyRef.current = false;
        }
      }
    };

    runAI();
    return () => { active = false; };
  }, [state, mode, difficulty, aiPlayer]);

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
    setDogIds((prev) => {
      const next = { ...prev };
      if (move.capture !== undefined) delete next[move.capture];
      if (state.board[move.from] === -1) {
        const id = next[move.from];
        delete next[move.from];
        if (id) next[move.to] = id;
      }
      return next;
    });
    setState(applyMove(state, move));
    setSelected(null);
  };

  const onNodeClick = (i: number) => {
    if (state.winner !== null || isThinking) return;
    if (mode === 'ai' && state.turn === aiPlayer) return;

    if (selected !== null && destinations.has(i)) {
      playMove(destinations.get(i)!);
      return;
    }

    if (state.board[i] === state.turn && movable.has(i)) {
      setSelected((s) => (s === i ? null : i));
    } else {
      setSelected(null);
    }
  };

  const remaining = Math.max(0, state.rules.maxCapturesToWin - state.dogsCaptured);

  return (
    <div className="flex flex-col items-center justify-between h-screen w-screen bg-[#e8dcc4] p-3 md:p-6 overflow-hidden relative font-sans select-none">
      {/* Fundo Vintage */}
      <div
        className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top Bar Harmoniosa */}
      <div className="z-10 flex w-full max-w-[500px] items-center justify-between gap-2 shrink-0 py-1">
        <a
          href="/"
          className="flex items-center gap-1.5 rounded-xl border-4 border-[#3a2218] bg-[#fdf8ef] px-3 py-1.5 text-xs font-black uppercase tracking-widest text-[#3a2218] shadow-[3px_3px_0_#3a2218] hover:-translate-y-0.5 transition-all"
        >
          <ArrowLeft size={16} strokeWidth={3} /> Sair
        </a>

        {/* Placar e Turno Unificados */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 rounded-full border-4 border-[#3a2218] bg-[#fdf8ef] px-4 py-1 shadow-[3px_3px_0_#3a2218]">
            <span className="text-xs md:text-sm font-black uppercase tracking-widest text-[#3a2218]">
              Faltam <span className="text-base text-[#e11d48] font-black">{remaining}</span> cães
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="rounded-full border-2 border-[#3a2218] bg-[#3a2218] px-2.5 py-0.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#fdf8ef] flex items-center gap-1">
              <span>Vez da {state.turn === 1 ? 'Onça' : 'Matilha'}</span>
              {mode === 'ai' && (
                <span className="text-[#c49a6c]">
                  ({state.turn === humanPlayer ? 'Você' : 'IA'})
                </span>
              )}
            </div>

            {mode === 'ai' && isThinking && (
              <div className="flex items-center gap-1 rounded-full border-2 border-[#3a2218] bg-[#c49a6c] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#3a2218] animate-pulse">
                <Cpu size={11} /> IA...
              </div>
            )}
          </div>
        </div>

        {/* Botão Reiniciar Ajustado */}
        <button
          type="button"
          onClick={restart}
          className="flex items-center justify-center rounded-xl border-4 border-[#3a2218] bg-[#c49a6c] px-3 py-1.5 text-[#3a2218] shadow-[3px_3px_0_#3a2218] hover:-translate-y-0.5 transition-all outline-none"
          aria-label="Reiniciar"
        >
          <RotateCcw size={16} strokeWidth={3} />
        </button>
      </div>

      {/* TABULEIRO SEM SOMBRA EXTERNA, COMPACTO E PROPORCIONAL AO SVG 100x140 */}
      <div className="relative z-10 aspect-[100/140] h-full max-h-[70vh] md:max-h-[78vh] w-auto overflow-hidden rounded-2xl border-8 border-[#3a2218] bg-[#fdf8ef] my-auto shrink-0">
        
        {/* Linhas SVG Finas */}
        <svg 
          className="absolute inset-0 h-full w-full pointer-events-none" 
          viewBox="0 0 100 140" 
          preserveAspectRatio="xMidYMid meet"
        >
          {LINES.map(([a, b], idx) => (
            <line
              key={idx}
              x1={COORDS[a].x}
              y1={COORDS[a].y}
              x2={COORDS[b].x}
              y2={COORDS[b].y}
              stroke="#3a2218"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ))}
          {/* Borda extra grossa ao redor do quadrado 5x5 para dar aquele charme do desenho original */}
          <rect x="10" y="10" width="80" height="80" fill="none" stroke="#3a2218" strokeWidth="2.5" />
        </svg>

        {/* Nós do Grafo e Peças */}
        {COORDS.map((c, i) => {
          const piece = state.board[i];
          const isSelected = selected === i;
          const isDest = destinations.has(i);
          const isCapture = isDest && destinations.get(i)?.capture !== undefined;
          const canSelect = piece === state.turn && movable.has(i);

          return (
            <button
              key={i}
              type="button"
              onClick={() => onNodeClick(i)}
              className="absolute flex h-9 w-9 md:h-11 md:w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center outline-none"
              style={{ left: `${c.x}%`, top: `${(c.y / 140) * 100}%` }}
            >
              {/* Pino do Nó */}
              <span className="absolute z-0 h-2 w-2 rounded-full border-2 border-[#3a2218] bg-[#b0b0b0]" />

              {/* Destino */}
              {isDest && (
                <span
                  className={`absolute z-10 h-7 w-7 animate-pulse rounded-full border-[3px] ${
                    isCapture
                      ? 'border-rose-500 bg-rose-500/30'
                      : 'border-emerald-600 bg-emerald-500/20'
                  }`}
                />
              )}

              {/* Peça (Amarela / Cinza) */}
              <AnimatePresence>
                {piece !== 0 && (
                  <motion.span
                    key={piece === 1 ? 'onca' : dogIds[i] || `d-${i}`}
                    layoutId={piece === 1 ? 'onca' : dogIds[i] || `d-${i}`}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: isSelected ? 1.15 : 1, opacity: 1 }}
                    exit={{ scale: 0.15, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`absolute z-20 h-7 w-7 md:h-8 md:w-8 rounded-full border-[3px] border-[#3a2218] ${
                      piece === 1 ? 'bg-[#f0c33c]' : 'bg-[#7d7d7d]'
                    } ${isSelected ? 'ring-4 ring-amber-400' : ''} ${
                      canSelect && selected === null ? 'ring-2 ring-[#3a2218]/30' : ''
                    }`}
                  />
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      <div className="shrink-0 h-2" />

      {/* Modal Fim de Jogo */}
      <AnimatePresence>
        {state.winner !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm rounded-3xl border-8 border-[#3a2218] bg-[#fdf8ef] p-8 text-center shadow-[12px_12px_0_#1a0e06]"
            >
              <Trophy size={64} className="mx-auto mb-4 text-[#c49a6c]" />
              <h2 className="mb-2 text-3xl font-black uppercase tracking-widest text-[#3a2218]">
                Fim de jogo
              </h2>
              <p
                className={`mb-8 text-lg font-black uppercase tracking-widest ${
                  state.winner === 1 ? 'text-[#c49a6c]' : 'text-[#3a2218]'
                }`}
              >
                {state.winner === 1 
                  ? (mode === 'ai' ? (humanPlayer === 1 ? 'Você Venceu!' : 'IA Venceu!') : 'A Onça Venceu!')
                  : (mode === 'ai' ? (humanPlayer === -1 ? 'Você Venceu!' : 'IA Venceu!') : 'Os Cães Venceram!')
                }
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={restart}
                  className="w-full rounded-xl border-4 border-[#3a2218] bg-[#c49a6c] py-3.5 font-black uppercase tracking-widest text-[#3a2218] shadow-[4px_4px_0_#3a2218] outline-none"
                >
                  Revanche
                </button>
                <a
                  href="/"
                  className="block w-full rounded-xl border-4 border-[#3a2218] bg-[#fdf8ef] py-3.5 font-black uppercase tracking-widest text-[#3a2218] shadow-[4px_4px_0_#3a2218]"
                >
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
