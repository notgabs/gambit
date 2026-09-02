'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { newGame, step } from '@/lib/engine/checkers';
import type { GameState, Move, Pos, Board } from '@/types/checkers';
import Piece from '@/components/Piece';
import confetti from 'canvas-confetti';
import { RotateCcw, ArrowLeft, Trophy } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { askAI, resetCheckersAI } from '@/lib/ai/askAI';
import type { Difficulty } from '@/lib/ai/checkersAI';

type PieceIdMap = Record<string, string>;
type LastMove = { from: Pos; to: Pos };

function posKey(p: Pos): string {
  return `${p[0]},${p[1]}`;
}

function samePos(a: Pos, b: Pos) {
  return a[0] === b[0] && a[1] === b[1];
}

function buildInitialIdMap(board: Board): PieceIdMap {
  const map: PieceIdMap = {};
  let gCount = 0;
  let rCount = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell > 0) {
        gCount++;
        map[`${r},${c}`] = `g-${gCount}`;
      } else if (cell < 0) {
        rCount++;
        map[`${r},${c}`] = `r-${rCount}`;
      }
    }
  }
  return map;
}

function moveIdMap(idMap: PieceIdMap, move: Move): PieceIdMap {
  const next = { ...idMap };
  const fromKey = posKey(move.from);
  const toKey = posKey(move.to);
  
  const pieceId = next[fromKey];
  delete next[fromKey];

  if (move.capture) {
    delete next[posKey(move.capture)];
  }

  if (pieceId) {
    next[toKey] = pieceId;
  }
  return next;
}

function pickMoveForDestination(moves: Move[], from: Pos, to: Pos): Move | null {
  const fromMoves = moves.filter((m) => samePos(m.from, from));
  if (!fromMoves.length) return null;

  for (const m of fromMoves) {
    if (m.fullPaths?.some((p) => p.length && samePos(p[p.length - 1], to))) {
      return m;
    }
  }

  for (const m of fromMoves) {
    if (m.fullPaths?.some((p) => p.some((sq) => samePos(sq, to)))) {
      return m;
    }
  }

  return fromMoves.find((m) => samePos(m.to, to)) ?? null;
}

function getPathIntent(move: Move, clicked: Pos): Pos[] {
  if (!move.fullPaths?.length) return [move.to];

  const byEnd = move.fullPaths.find(
    (p) => p.length && samePos(p[p.length - 1], clicked)
  );
  if (byEnd) return byEnd;

  const byMid = move.fullPaths.find((p) => p.some((sq) => samePos(sq, clicked)));
  if (byMid) return byMid;

  return [...move.fullPaths].sort((a, b) => b.length - a.length)[0];
}

export default function CheckersBoard() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'ai' ? 'ai' : 'offline';
  const difficulty = (searchParams.get('difficulty') || 'medio') as Difficulty;
  const theme = searchParams.get('theme') || 'vintage';
  const isThematic = theme === 'thematic';

  const [state, setState] = useState<GameState>(() => newGame());
  const [selected, setSelected] = useState<Pos | null>(null);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [idMap, setIdMap] = useState<PieceIdMap>(() => buildInitialIdMap(newGame().board));
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverCell, setHoverCell] = useState<Pos | null>(null);

  const busyRef = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const regras = {
      canCaptureBackwards: searchParams.get('backwards') !== 'false',
      kingStopsImmediately: searchParams.get('kingStops') === 'true',
    };
    const fresh = newGame(regras);
    setState(fresh);
    setSelected(null);
    setLastMove(null);
    setIdMap(buildInitialIdMap(fresh.board));
    setIsAnimating(false);
    busyRef.current = false;
    resetCheckersAI();
  }, [searchParams]);

  const score = useMemo(
    () => ({
      green: 12 - state.board.flat().filter((c) => c === -1 || c === -2).length,
      red: 12 - state.board.flat().filter((c) => c === 1 || c === 2).length,
    }),
    [state.board]
  );

  const movableKeys = useMemo(() => {
    const set = new Set<string>();
    for (const m of state.legalMoves) set.add(posKey(m.from));
    return set;
  }, [state.legalMoves]);

  const mustCapture = useMemo(
    () => state.legalMoves.length > 0 && state.legalMoves.every((m) => !!m.capture),
    [state.legalMoves]
  );

  const destinations = useMemo(() => {
    const map = new Map<string, Move>();
    if (!selected) return map;

    for (const m of state.legalMoves) {
      if (!samePos(m.from, selected)) continue;

      map.set(`${m.to[0]},${m.to[1]}`, m);

      if (m.fullPaths) {
        for (const path of m.fullPaths) {
          for (const sq of path) {
            map.set(`${sq[0]},${sq[1]}`, m);
          }
        }
      }
    }
    return map;
  }, [selected, state.legalMoves]);

  useEffect(() => {
    if (!state.winner) return;
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.65 },
      colors:
        state.winner === 1
          ? ['#10b981', '#059669', '#ffffff']
          : ['#f43f5e', '#e11d48', '#ffffff'],
    });
  }, [state.winner]);

  const applyOneMove = useCallback((current: GameState, move: Move): GameState => {
    const next = step(current, move);
    setIdMap((prev) => moveIdMap(prev, move));
    setLastMove({ from: move.from, to: move.to });
    return next;
  }, []);

  const playPlayerMove = useCallback(
    async (from: Pos, to: Pos) => {
      if (busyRef.current || isAnimating) return;
      const current = stateRef.current;
      if (current.winner) return;
      if (mode === 'ai' && current.turn === -1) return;

      const move = pickMoveForDestination(current.legalMoves, from, to);
      if (!move) return;

      busyRef.current = true;
      setIsAnimating(true);
      setSelected(null);
      setHoverCell(null);

      try {
        const intent = getPathIntent(move, to);

        let live = applyOneMove(current, move);
        setState(live);
        await new Promise((r) => setTimeout(r, 180));

        let guard = 0;
        while (
          !live.winner &&
          live.turn === current.turn &&
          live.legalMoves.length > 0 &&
          live.legalMoves.every((m) => m.capture) &&
          guard < 12
        ) {
          guard++;

          const nowFrom = live.legalMoves[0].from;
          const currentPos = nowFrom;
          const intentIdx = intent.findIndex((p) => samePos(p, currentPos));
          const desiredNext =
            intentIdx >= 0 && intentIdx < intent.length - 1
              ? intent[intentIdx + 1]
              : null;

          let nextMove: Move | undefined;
          if (desiredNext) {
            nextMove = live.legalMoves.find((m) => samePos(m.to, desiredNext));
          }
          if (!nextMove) nextMove = live.legalMoves[0];

          await new Promise((r) => setTimeout(r, 200));
          live = applyOneMove(live, nextMove);
          setState(live);

          (move as Move).to = nextMove.to;
        }

        if (
          !live.winner &&
          live.turn === current.turn &&
          live.legalMoves.length > 0
        ) {
          setSelected(live.legalMoves[0].from);
        }
      } finally {
        setIsAnimating(false);
        busyRef.current = false;
      }
    },
    [applyOneMove, isAnimating, mode]
  );

  useEffect(() => {
    if (mode !== 'ai' || state.winner || state.turn !== -1 || isAnimating) return;
    if (busyRef.current) return;

    let active = true;

    const run = async () => {
      busyRef.current = true;
      setIsAnimating(true);
      setSelected(null);

      try {
        const delay = difficulty === 'dificil' ? 250 : 500;
        const [move] = await Promise.all([
          askAI(state.board, -1, difficulty, state.rules),
          new Promise((r) => setTimeout(r, delay)),
        ]);
        if (!active || !move) return;

        let live = applyOneMove(state, move);
        setState(live);

        while (active && !live.winner && live.turn === -1 && live.legalMoves.length) {
          await new Promise((r) => setTimeout(r, 200));
          const next = live.legalMoves[0];
          if (!next) break;
          live = applyOneMove(live, next);
          setState(live);
        }
      } catch (err) {
        console.error('AI Error:', err);
      } finally {
        if (active) {
          setIsAnimating(false);
          busyRef.current = false;
        }
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [state.turn, state.winner, mode, difficulty, isAnimating, state, applyOneMove]);

  const canControl = (cell: number) => {
    if (state.winner || isAnimating) return false;
    if (mode === 'ai' && state.turn === -1) return false;
    return (cell > 0 && state.turn === 1) || (cell < 0 && state.turn === -1);
  };

  const handleCellClick = (row: number, col: number) => {
    if (state.winner || isAnimating) return;
    if (mode === 'ai' && state.turn === -1) return;

    const cell = state.board[row][col];
    const pos: Pos = [row, col];
    const key = posKey(pos);

    if (!selected) {
      if (!canControl(cell)) return;
      if (!movableKeys.has(key)) return;
      setSelected(pos);
      return;
    }

    if (samePos(selected, pos)) {
      const forced =
        state.legalMoves.length > 0 &&
        state.legalMoves.every((m) => m.capture && samePos(m.from, selected));
      if (!forced) setSelected(null);
      return;
    }

    const destKey = `${row},${col}`;
    if (destinations.has(destKey)) {
      void playPlayerMove(selected, pos);
      return;
    }

    const forcedContinuation =
      state.legalMoves.length > 0 &&
      state.legalMoves.every(
        (m) => m.capture && selected && samePos(m.from, selected)
      );
    if (forcedContinuation) return;

    if (canControl(cell) && movableKeys.has(key)) {
      setSelected(pos);
      return;
    }

    setSelected(null);
  };

  const cellFromPoint = (x: number, y: number): Pos | null => {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const relX = x - rect.left;
    const relY = y - rect.top;
    if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) return null;
    const size = rect.width / 8;
    const col = Math.min(7, Math.max(0, Math.floor(relX / size)));
    const row = Math.min(7, Math.max(0, Math.floor(relY / size)));
    return [row, col];
  };

  const restart = () => {
    const fresh = newGame(state.rules);
    setState(fresh);
    setSelected(null);
    setLastMove(null);
    setIdMap(buildInitialIdMap(fresh.board));
    setHoverCell(null);
    setIsDragging(false);
    busyRef.current = false;
    setIsAnimating(false);
    resetCheckersAI();
  };

  const renderCell = (row: number, col: number) => {
    const cell = state.board[row][col];
    const isDark = (row + col) % 2 === 1;
    const pos: Pos = [row, col];
    const key = posKey(pos);

    const isSelected = !!selected && samePos(selected, pos);
    const isDest = destinations.has(`${row},${col}`);
    const isLast =
      !!lastMove &&
      (samePos(lastMove.from, pos) || samePos(lastMove.to, pos));
    const isJustPromoted =
      !!state.justPromotedPos && samePos(state.justPromotedPos, pos);
    const isMovable = movableKeys.has(key) && canControl(cell);
    const isHoverDest =
      !!hoverCell && samePos(hoverCell, pos) && isDest && isDragging;

    const destMove = destinations.get(`${row},${col}`);
    const isCaptureDest = !!(destMove?.capture || (destMove?.fullPaths && destMove.fullPaths.length));

    const pieceId = cell !== 0 ? idMap[key] : undefined;

    const canDrag =
      cell !== 0 &&
      canControl(cell) &&
      isMovable &&
      !isAnimating &&
      !state.winner;

    const dragProps = canDrag
      ? {
          drag: true as const,
          dragSnapToOrigin: true,
          dragElastic: 0.1,
          dragMomentum: false,
          whileDrag: {
            scale: 1.15,
            zIndex: 80,
            cursor: 'grabbing',
            filter: 'drop-shadow(0px 15px 12px rgba(0,0,0,0.55))',
          },
          style: { touchAction: 'none' as const },
          onDragStart: () => {
            setSelected(pos);
            setIsDragging(true);
          },
          onDrag: (_e: any, info: PanInfo) => {
            const over = cellFromPoint(info.point.x, info.point.y);
            if (over && destinations.has(`${over[0]},${over[1]}`)) {
              setHoverCell(over);
            } else {
              setHoverCell(null);
            }
          },
          onDragEnd: (_e: any, info: PanInfo) => {
            setIsDragging(false);
            const over = cellFromPoint(info.point.x, info.point.y);
            setHoverCell(null);
            if (over) {
              if (destinations.has(`${over[0]},${over[1]}`) || selected) {
                void playPlayerMove(pos, over);
              }
            }
          },
        }
      : {};

    return (
      <div
        key={`${row}-${col}`}
        className={`
          relative w-full h-full flex items-center justify-center select-none
          ${isDark ? 'bg-[#5c3a22]' : 'bg-[#e8dcc4]'}
          ${isSelected || isJustPromoted ? 'z-30' : 'z-10'}
        `}
        onClick={() => handleCellClick(row, col)}
      >
        {/* Último lance */}
        {isLast && (
          <div className="absolute inset-0 bg-amber-300/35 pointer-events-none" />
        )}

        {/* Hover de drop válido */}
        {isHoverDest && (
          <div className="absolute inset-0 bg-emerald-400/25 ring-4 ring-inset ring-emerald-400/70 pointer-events-none z-20" />
        )}

        {/* Anéis de jogada válida */}
        {isMovable && !selected && mustCapture && (
          <div className="absolute inset-[12%] rounded-full ring-4 ring-amber-400/80 animate-pulse pointer-events-none z-10" />
        )}
        {isMovable && !selected && !mustCapture && (
          <div className="absolute inset-[18%] rounded-full ring-2 ring-white/25 pointer-events-none z-10" />
        )}

        {/* Ghost da peça arrastada */}
        {cell !== 0 && isSelected && isDragging && (
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none z-10">
            <div className="w-[80%] h-[80%]">
              <Piece cell={cell} />
            </div>
          </div>
        )}

        {/* Peça Animada estritamente dentro da célula */}
        <AnimatePresence>
          {cell !== 0 && pieceId && (
            <motion.div
              key={pieceId}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: isSelected && !isDragging ? 1.08 : 1,
                opacity: 1,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`w-[80%] h-[80%] flex items-center justify-center z-20 ${
                canDrag ? 'cursor-grab' : ''
              }`}
              {...dragProps}
            >
              <Piece
                cell={cell}
                isSelected={isSelected && !isDragging}
                isJustPromoted={!!isJustPromoted}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ponto de destino simples */}
        {isDest && cell === 0 && !isHoverDest && (
          <div
            className={`absolute rounded-full pointer-events-none z-30 ${
              isCaptureDest
                ? 'w-[22%] h-[22%] bg-rose-500/80'
                : 'w-[18%] h-[18%] bg-white/50'
            }`}
          />
        )}

        {/* Anel de captura sobre peça inimiga */}
        {isDest && cell !== 0 && (
          <div className="absolute inset-0 m-1 border-4 border-rose-500 rounded-full pointer-events-none z-30 opacity-90" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-screen items-center justify-center bg-[#e8dcc4] p-4 lg:p-8 gap-4 overflow-hidden relative font-sans">
      {/* Fundo vintage */}
      <div
        className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(58,34,24,0.4)_120%)]" />

      {/* Top bar */}
      <div className="flex w-full max-w-[95vw] lg:max-w-[80vh] items-center justify-between z-20">
        <a
          href="/"
          className="flex items-center gap-2 bg-[#fdf8ef] border-4 border-[#3a2218] text-[#3a2218] px-4 py-2 rounded-xl font-black uppercase text-sm tracking-widest shadow-[4px_4px_0px_#3a2218] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#3a2218] transition-all"
        >
          <ArrowLeft size={18} strokeWidth={3} /> Sair
        </a>

        {/* Placar e Status Container */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center bg-[#fdf8ef] border-4 border-[#3a2218] rounded-xl shadow-[4px_4px_0px_#3a2218] overflow-hidden">
            <div
              className={`px-4 py-2 flex items-center gap-2 ${
                state.turn === 1 && !state.winner
                  ? 'bg-[#4a8b54] text-white'
                  : 'text-[#3a2218]'
              }`}
            >
              <span className="font-black text-xl">{score.green}</span>
              <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-current" />
            </div>
            <div className="w-1 self-stretch bg-[#3a2218]" />
            <div
              className={`px-4 py-2 flex items-center gap-2 ${
                state.turn === -1 && !state.winner
                  ? 'bg-[#e11d48] text-white'
                  : 'text-[#3a2218]'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-rose-400 border-2 border-current" />
              <span className="font-black text-xl">{score.red}</span>
            </div>
          </div>

          {/* Container COM ALTURA FIXA (h-6) para evitar PULOS de layout */}
          <div className="h-6 flex items-center justify-center">
            {mustCapture && !state.winner && !isAnimating ? (
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-900 bg-amber-200 border-2 border-[#3a2218] px-3 py-0.5 rounded-full shadow-[2px_2px_0px_#3a2218]">
                Captura obrigatória!
              </div>
            ) : mode === 'ai' && state.turn === -1 && !state.winner ? (
              <div className="text-[10px] font-black uppercase tracking-widest text-[#fdf8ef] bg-[#3a2218] px-3 py-0.5 rounded-full animate-pulse">
                IA pensando...
              </div>
            ) : null}
          </div>
        </div>

        <button
          onClick={restart}
          className="flex items-center gap-2 bg-[#c49a6c] border-4 border-[#3a2218] text-[#3a2218] px-4 py-2 rounded-xl font-black uppercase text-sm tracking-widest shadow-[4px_4px_0px_#3a2218] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#3a2218] transition-all"
        >
          <RotateCcw size={18} strokeWidth={3} />
        </button>
      </div>

      {/* Tabuleiro 8x8 Estático */}
      <div
        ref={boardRef}
        className="grid grid-cols-8 grid-rows-8 w-full max-w-[95vw] lg:max-w-[80vh] aspect-square border-8 border-[#3a2218] bg-[#3a2218] shadow-[12px_12px_0px_#3a2218] rounded-lg overflow-hidden relative z-10 shrink-0"
        style={{ touchAction: 'none' }}
      >
        {isThematic && (
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-blue-500 border-4 border-[#3a2218] shadow-[4px_4px_0_#3a2218] z-0 pointer-events-none" />
        )}
        
        {Array.from({ length: 8 }).map((_, r) =>
          Array.from({ length: 8 }).map((_, c) => renderCell(r, c))
        )}

        {/* Rotas de combo em SVG */}
        {selected && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-30 drop-shadow"
            viewBox="0 0 8 8"
          >
            {state.legalMoves
              .filter((m) => samePos(m.from, selected) && m.fullPaths?.length)
              .flatMap((m, i) =>
                m.fullPaths!.map((path, j) => {
                  if (path.length < 1) return null;
                  const points = [selected, ...path]
                    .map((p) => `${p[1] + 0.5},${p[0] + 0.5}`)
                    .join(' ');
                  const end = path[path.length - 1];
                  return (
                    <g key={`path-${i}-${j}`}>
                      <polyline
                        points={points}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="0.14"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeOpacity="0.85"
                      />
                      <circle
                        cx={end[1] + 0.5}
                        cy={end[0] + 0.5}
                        r="0.18"
                        fill="#fbbf24"
                        opacity="0.95"
                      />
                    </g>
                  );
                })
              )}
          </svg>
        )}
      </div>

      {/* Modal Vitória */}
      <AnimatePresence>
        {state.winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="p-8 bg-[#fdf8ef] rounded-3xl shadow-[16px_16px_0px_#1a0e06] text-center w-full max-w-sm border-8 border-[#3a2218]"
            >
              <Trophy size={72} className="mx-auto mb-4 text-[#c49a6c]" />
              <h2 className="text-4xl font-black uppercase tracking-widest text-[#3a2218] mb-2">
                Vitória!
              </h2>
              <p
                className={`text-xl font-black uppercase tracking-widest mb-8 ${
                  state.winner === 1 ? 'text-[#4a8b54]' : 'text-[#e11d48]'
                }`}
              >
                {state.winner === 1 ? 'Verde venceu' : 'Vermelho venceu'}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={restart}
                  className="w-full py-4 bg-[#c49a6c] border-4 border-[#3a2218] text-[#3a2218] rounded-xl font-black uppercase tracking-widest shadow-[4px_4px_0px_#3a2218] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#3a2218] transition-all"
                >
                  Jogar novamente
                </button>
                <a
                  href="/"
                  className="w-full py-4 bg-[#fdf8ef] border-4 border-[#3a2218] text-[#3a2218] rounded-xl font-black uppercase tracking-widest shadow-[4px_4px_0px_#3a2218] hover:bg-[#e8dcc4] transition-all block"
                >
                  Voltar
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
