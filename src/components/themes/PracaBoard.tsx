'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { newGame, step } from '@/lib/engine/checkers';
import type { GameState, Move, Pos } from '@/types/checkers';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence, PanInfo, LayoutGroup } from 'framer-motion';
import { askAI, resetCheckersAI } from '@/lib/ai/askAI';
import type { Difficulty } from '@/lib/ai/checkersAI';

type PieceIdMap = Record<string, string>;

function posKey(p: Pos): string { return `${p[0]},${p[1]}`; }
function samePos(a: Pos, b: Pos) { return a[0] === b[0] && a[1] === b[1]; }

function buildInitialIdMap(board: any): PieceIdMap {
  const map: PieceIdMap = {};
  let gCount = 0; let rCount = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] > 0) map[`${r},${c}`] = `g-${++gCount}`;
      else if (board[r][c] < 0) map[`${r},${c}`] = `r-${++rCount}`;
    }
  }
  return map;
}

function moveIdMap(idMap: PieceIdMap, move: Move): PieceIdMap {
  const next = { ...idMap };
  const fromKey = posKey(move.from);
  const pieceId = next[fromKey];
  delete next[fromKey];
  if (move.capture) delete next[posKey(move.capture)];
  if (pieceId) next[posKey(move.to)] = pieceId;
  return next;
}

function pickMoveForDestination(moves: Move[], from: Pos, to: Pos): Move | null {
  const fromMoves = moves.filter((m) => samePos(m.from, from));
  if (!fromMoves.length) return null;
  for (const m of fromMoves) {
    if (m.fullPaths?.some((p) => p.length && samePos(p[p.length - 1], to))) return m;
  }
  return fromMoves.find((m) => samePos(m.to, to)) ?? null;
}

// Componente Tampinha PET em CSS (Placeholder 3D)
const TampinhaPET = ({ isGreen, isKing, isSelected }: { isGreen: boolean; isKing: boolean; isSelected: boolean }) => {
  const color = isGreen ? '#4ade80' : '#facc15';
  const darkColor = isGreen ? '#166534' : '#a16207';
  
  return (
    <div 
      className="relative w-full h-full flex items-center justify-center transition-transform duration-200 preserve-3d"
      style={{
        transform: isSelected ? 'rotateX(-20deg) translateY(-16px) scale(1.1)' : 'rotateX(-35deg)'
      }}
    >
      <div className={`absolute bottom-[-10px] w-full h-[30%] bg-black/40 blur-[4px] rounded-full transition-all duration-300 ${isSelected ? 'translate-y-4 scale-75 opacity-20' : ''}`} />

      <div 
        className="w-[85%] aspect-square rounded-full absolute z-10 flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}, ${darkColor})`,
          boxShadow: `inset 0 0 10px rgba(0,0,0,0.5), 0 4px 6px rgba(0,0,0,0.4), inset 0 0 0 4px ${color}, inset 0 0 0 6px ${darkColor}`,
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <span className="opacity-20 font-black text-[10px] mix-blend-overlay">PET</span>
      </div>

      {isKing && (
        <div 
          className="w-[85%] aspect-square rounded-full absolute z-20 flex items-center justify-center"
          style={{
            transform: 'translateY(-12px)',
            background: `radial-gradient(circle at 30% 30%, ${color}, ${darkColor})`,
            boxShadow: `inset 0 0 10px rgba(0,0,0,0.5), 0 8px 10px rgba(0,0,0,0.6), inset 0 0 0 4px ${color}, inset 0 0 0 6px ${darkColor}`,
          }}
        />
      )}
    </div>
  );
};

export default function PracaBoard() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'ai' ? 'ai' : 'offline';

  const [state, setState] = useState<GameState>(() => newGame());
  const [selected, setSelected] = useState<Pos | null>(null);
  const [idMap, setIdMap] = useState<PieceIdMap>(() => buildInitialIdMap(newGame().board));
  const [isAnimating, setIsAnimating] = useState(false);

  const busyRef = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const regras = { canCaptureBackwards: true, kingStopsImmediately: false };
    const fresh = newGame(regras);
    setState(fresh);
    setIdMap(buildInitialIdMap(fresh.board));
    resetCheckersAI();
  }, []);

  const movableKeys = useMemo(() => {
    const set = new Set<string>();
    for (const m of state.legalMoves) set.add(posKey(m.from));
    return set;
  }, [state.legalMoves]);

  const destinations = useMemo(() => {
    const map = new Map<string, Move>();
    if (!selected) return map;
    for (const m of state.legalMoves) {
      if (!samePos(m.from, selected)) continue;
      map.set(`${m.to[0]},${m.to[1]}`, m);
    }
    return map;
  }, [selected, state.legalMoves]);

  const applyOneMove = useCallback((current: GameState, move: Move): GameState => {
    const next = step(current, move);
    setIdMap((prev) => moveIdMap(prev, move));
    return next;
  }, []);

  const playPlayerMove = useCallback(async (from: Pos, to: Pos) => {
    if (busyRef.current || isAnimating) return;
    const current = stateRef.current;
    if (current.winner || (mode === 'ai' && current.turn === -1)) return;

    const move = pickMoveForDestination(current.legalMoves, from, to);
    if (!move) return;

    busyRef.current = true;
    setIsAnimating(true);
    setSelected(null);

    let live = applyOneMove(current, move);
    setState(live);
    await new Promise((r) => setTimeout(r, 200));

    let guard = 0;
    while (!live.winner && live.turn === current.turn && live.legalMoves.every((m) => m.capture) && guard < 6) {
      guard++;
      const nextMove = live.legalMoves[0];
      await new Promise((r) => setTimeout(r, 250));
      live = applyOneMove(live, nextMove);
      setState(live);
    }
    setIsAnimating(false);
    busyRef.current = false;
  }, [applyOneMove, isAnimating, mode]);

  const canControl = (cell: number) => {
    if (state.winner || isAnimating) return false;
    if (mode === 'ai' && state.turn === -1) return false;
    return (cell > 0 && state.turn === 1) || (cell < 0 && state.turn === -1);
  };

  const handleCellClick = (row: number, col: number) => {
    if (state.winner || isAnimating || (mode === 'ai' && state.turn === -1)) return;
    const cell = state.board[row][col];
    const pos: Pos = [row, col];
    const key = posKey(pos);

    if (!selected) {
      if (canControl(cell) && movableKeys.has(key)) setSelected(pos);
      return;
    }
    if (destinations.has(`${row},${col}`)) {
      void playPlayerMove(selected, pos);
      return;
    }
    setSelected(null);
  };

  const renderCell = (row: number, col: number) => {
    const cell = state.board[row][col];
    const isDark = (row + col) % 2 === 1;
    const pos: Pos = [row, col];
    const key = posKey(pos);
    const pieceId = cell !== 0 ? idMap[key] : undefined;
    const isSelected = !!selected && samePos(selected, pos);
    const isDest = destinations.has(`${row},${col}`);
    const isGreen = cell > 0;
    const isKing = Math.abs(cell) === 2;

    return (
      <div
        key={`${row}-${col}`}
        className={`relative w-full h-full flex items-center justify-center preserve-3d
          ${isDark ? 'bg-black/10 border-t border-l border-white/5' : 'bg-transparent'}
        `}
        style={{ boxShadow: isDark ? 'inset 0 0 15px rgba(0,0,0,0.1)' : 'none' }}
        onClick={() => handleCellClick(row, col)}
      >
        {isDest && (
          <div 
            className="absolute w-[40%] h-[40%] bg-white/30 rounded-full border-2 border-dashed border-white/50 animate-pulse"
            style={{ transform: 'rotateX(-35deg)' }}
          />
        )}

        <AnimatePresence>
          {cell !== 0 && pieceId && (
            <motion.div
              layoutId={pieceId}
              className="absolute inset-0 z-20 w-full h-full preserve-3d"
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            >
              <TampinhaPET isGreen={isGreen} isKing={isKing} isSelected={isSelected} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <LayoutGroup>
      <div 
        className="flex flex-col items-center justify-end w-screen h-screen overflow-hidden bg-sky-200 relative"
        style={{ perspective: '1200px' }}
      >
        {/* Fundo Praça */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-green-800 to-stone-900 blur-sm z-0" />
        
        {/* Pombos em animação */}
        <div className="absolute top-[40%] left-[-10%] w-8 h-8 bg-white/80 rounded-full blur-[2px] animate-[fly_15s_linear_infinite] z-10" />

        {/* Mesa de Cimento + Tabuleiro 2.5D */}
        <div className="relative z-20 w-full max-w-[800px] aspect-square flex flex-col items-center justify-end pb-[10vh]">
          <div 
            className="absolute bottom-[-20%] w-[140%] aspect-square bg-stone-400 rounded-full border-[12px] border-stone-500 shadow-[0_50px_100px_rgba(0,0,0,0.8)] z-10"
            style={{
              transform: 'rotateX(35deg)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E")`,
            }}
          />

          <div 
            ref={boardRef}
            className="w-[85%] sm:w-[90%] aspect-square grid grid-cols-8 grid-rows-8 border-4 border-stone-800/20 relative z-20 bg-stone-300/30 backdrop-blur-sm preserve-3d"
            style={{ transform: 'rotateX(35deg)' }}
          >
            {Array.from({ length: 8 }).map((_, r) =>
              Array.from({ length: 8 }).map((_, c) => renderCell(r, c))
            )}
          </div>
        </div>

        {/* HUD */}
        <div className="absolute top-6 left-6 z-50">
          <a href="/" className="flex items-center gap-2 bg-white/80 backdrop-blur-md text-stone-800 px-4 py-2 rounded-full font-black uppercase text-xs shadow-lg hover:scale-105 transition-all">
            <ArrowLeft size={16} /> Voltar pra Casa
          </a>
        </div>
      </div>
    </LayoutGroup>
  );
}
