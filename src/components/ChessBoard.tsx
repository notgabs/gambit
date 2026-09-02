'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  parseFEN,
  generateLegalMoves,
  makeMove,
  getResult,
  isSquareAttacked,
} from '@/lib/chess';
import type { GameState, Square, Move, MoveResult, PieceType, Color } from '@/lib/chess/types';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { RotateCcw, ArrowLeft, Trophy } from 'lucide-react';
import { askChessAI, resetChessAI } from '@/lib/chess/ai';
import type { Difficulty } from '@/lib/chess/ai';
import { playChessSound, resolveMoveSound } from '@/lib/chess/sound';
import { moveToSAN } from '@/lib/chess/notation';
import MoveHistory from './MoveHistory';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const unicodeMap: Record<string, string> = {
  wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕', wk: '♔',
  bp: '♟︎', bn: '♞', bb: '♝', br: '♜', bq: '♛', bk: '♚',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

type PendingPromotion = { from: Square; to: Square; options: Move[] };
type LastMove = { from: Square; to: Square };
type PieceIdMap = Record<number, string>;

function buildInitialIdMap(state: GameState): PieceIdMap {
  const map: PieceIdMap = {};
  state.board.forEach((p, sq) => {
    if (p) map[sq] = `${p.color}${p.type}-${sq}-init`;
  });
  return map;
}

function updateIdMap(idMap: PieceIdMap, prevState: GameState, move: Move, mr: MoveResult): PieceIdMap {
  const next = { ...idMap };
  const movingPiece = prevState.board[move.from];
  const movingId = next[move.from] ?? `${movingPiece?.color}${movingPiece?.type}-${move.from}-fallback`;
  delete next[move.from];

  if (mr.isEnPassant) {
    const capSq = prevState.turn === 'w' ? move.to - 8 : move.to + 8;
    delete next[capSq];
  }

  next[move.to] = movingId;

  if (mr.isCastling) {
    const r = Math.floor(move.to / 8);
    if (move.to > move.from) {
      const rookFrom = r * 8 + 7, rookTo = r * 8 + 5;
      next[rookTo] = next[rookFrom];
      delete next[rookFrom];
    } else {
      const rookFrom = r * 8 + 0, rookTo = r * 8 + 3;
      next[rookTo] = next[rookFrom];
      delete next[rookFrom];
    }
  }

  return next;
}

function computeInCheck(s: GameState): boolean {
  let kingSq = -1;
  for (let i = 0; i < 64; i++) {
    const p = s.board[i];
    if (p && p.type === 'k' && p.color === s.turn) {
      kingSq = i;
      break;
    }
  }
  if (kingSq === -1) return false;
  return isSquareAttacked(s, kingSq, s.turn === 'w' ? 'b' : 'w');
}

function PromotionPicker({ color, onSelect }: { color: Color; onSelect: (t: PieceType) => void }) {
  const options: { type: PieceType; symbol: string }[] = [
    { type: 'q', symbol: color === 'w' ? '♕' : '♛' },
    { type: 'r', symbol: color === 'w' ? '♖' : '♜' },
    { type: 'b', symbol: color === 'w' ? '♗' : '♝' },
    { type: 'n', symbol: color === 'w' ? '♘' : '♞' },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#fdf8ef] border-4 border-[#3a2218] rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl"
      >
        <p className="font-black uppercase tracking-widest text-[#3a2218] text-sm">Promover para:</p>
        <div className="flex gap-3">
          {options.map(o => (
            <button
              key={o.type}
              onClick={() => onSelect(o.type)}
              className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-xl border-4 border-[#3a2218] text-3xl md:text-4xl hover:scale-110 active:scale-95 transition-all shadow-md ${
                color === 'w' ? 'bg-white text-black' : 'bg-[#3a2218] text-white'
              }`}
            >
              {o.symbol}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ChessBoard() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'ai' ? 'ai' : 'offline';
  const difficulty = (searchParams.get('difficulty') || 'medio') as Difficulty;
  const theme = searchParams.get('theme') || 'vintage';
  const isThematic = theme === 'thematic';

  const [state, setState] = useState<GameState>(() => parseFEN(START_FEN));
  const [result, setResult] = useState<string>('*');
  const [selected, setSelected] = useState<Square | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [idMap, setIdMap] = useState<PieceIdMap>(() => buildInitialIdMap(state));
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);

  const busyRef = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const legalMoves = useMemo(() => generateLegalMoves(state), [state]);

  const destMovesByTo = useMemo(() => {
    const map = new Map<number, Move[]>();
    if (selected !== null) {
      for (const m of legalMoves) {
        if (m.from === selected) {
          const arr = map.get(m.to) ?? [];
          arr.push(m);
          map.set(m.to, arr);
        }
      }
    }
    return map;
  }, [legalMoves, selected]);

  const kingSquare = useMemo(() => {
    for (let i = 0; i < 64; i++) {
      const p = state.board[i];
      if (p && p.type === 'k' && p.color === state.turn) return i;
    }
    return -1;
  }, [state]);

  const inCheck = useMemo(() => {
    if (kingSquare === -1) return false;
    return isSquareAttacked(state, kingSquare, state.turn === 'w' ? 'b' : 'w');
  }, [state, kingSquare]);

  const restart = () => {
    const fresh = parseFEN(START_FEN);
    setState(fresh);
    setResult('*');
    setSelected(null);
    setLastMove(null);
    setPendingPromotion(null);
    setIdMap(buildInitialIdMap(fresh));
    setHoveredSquare(null);
    setIsDragging(false);
    setMoveHistory([]);
    busyRef.current = false;
    setIsAnimating(false);
    resetChessAI();
    playChessSound('gameStart');
  };

  useEffect(() => {
    playChessSound('gameStart');
  }, []);

  useEffect(() => {
    if (result !== '*') {
      const isWin = result === '1-0' || result === '0-1';
      if (isWin) {
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({
            particleCount: 140,
            spread: 120,
            origin: { y: 0.6 },
            colors: result === '1-0' ? ['#10b981', '#059669'] : ['#f43f5e', '#e11d48'],
          });
        });
      }
    }
  }, [result]);

  useEffect(() => {
    if (mode !== 'ai' || state.turn !== 'b' || result !== '*') return;
    if (busyRef.current) return;

    let alive = true;
    const runAI = async () => {
      busyRef.current = true;
      setIsAnimating(true);
      try {
        const move = await askChessAI(state, difficulty);
        if (!alive || !move) return;

        const mr = makeMove(state, move);
        const san = moveToSAN(state, move, mr);
        const newResult = getResult(mr.newState);

        setIdMap(prev => updateIdMap(prev, state, move, mr));
        setLastMove({ from: move.from, to: move.to });
        setState(mr.newState);
        setResult(newResult);
        setMoveHistory(prev => [...prev, san]);

        const isGameOver = newResult !== '*';
        playChessSound(resolveMoveSound({
          captured: !!mr.captured,
          isCastling: mr.isCastling,
          isPromotion: mr.isPromotion,
          isCheck: !isGameOver && computeInCheck(mr.newState),
          isGameOver,
        }));
      } catch (e) {
        console.error('AI error:', e);
      } finally {
        setTimeout(() => setIsAnimating(false), 260);
        busyRef.current = false;
      }
    };
    runAI();

    return () => { alive = false; };
  }, [state.turn, mode, difficulty, result]);

  const applyMove = (move: Move) => {
    setSelected(null);
    setIsAnimating(true);
    const mr = makeMove(state, move);
    const san = moveToSAN(state, move, mr);
    const newResult = getResult(mr.newState);

    setIdMap(prev => updateIdMap(prev, state, move, mr));
    setLastMove({ from: move.from, to: move.to });
    setState(mr.newState);
    setResult(newResult);
    setMoveHistory(prev => [...prev, san]);

    const isGameOver = newResult !== '*';
    playChessSound(resolveMoveSound({
      captured: !!mr.captured,
      isCastling: mr.isCastling,
      isPromotion: mr.isPromotion,
      isCheck: !isGameOver && computeInCheck(mr.newState),
      isGameOver,
    }));

    setTimeout(() => setIsAnimating(false), 260);
  };

  const handleCellClick = (sq: Square) => {
    if (result !== '*' || isAnimating || pendingPromotion) return;
    if (mode === 'ai' && state.turn === 'b') return;

    const piece = state.board[sq];

    if (selected === null) {
      if (piece && piece.color === state.turn) setSelected(sq);
      return;
    }

    if (sq === selected) {
      setSelected(null);
      return;
    }

    const options = destMovesByTo.get(sq);

    if (!options) {
      if (piece && piece.color === state.turn) {
        setSelected(sq);
      } else {
        setSelected(null);
      }
      return;
    }

    if (options.length > 1) {
      setPendingPromotion({ from: selected, to: sq, options });
      setSelected(null);
      return;
    }

    applyMove(options[0]);
  };

  const handlePromotionSelect = (type: PieceType) => {
    if (!pendingPromotion) return;
    const move = pendingPromotion.options.find(o => o.promotion === type);
    setPendingPromotion(null);
    if (move) applyMove(move);
  };

  const computeSquareFromPoint = (x: number, y: number): Square | null => {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const relX = x - rect.left;
    const relY = y - rect.top;
    
    if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) return null;

    const cellSize = rect.width / 8;
    const col = Math.min(7, Math.max(0, Math.floor(relX / cellSize)));
    const rowFromTop = Math.min(7, Math.max(0, Math.floor(relY / cellSize)));
    const r = 7 - rowFromTop;
    return r * 8 + col;
  };

  const renderSquare = (sq: Square) => {
    const piece = state.board[sq];
    const file = sq % 8;
    const rank = Math.floor(sq / 8);
    const dark = (rank + file) % 2 === 0;
    const isSelected = selected === sq;
    const destMoves = destMovesByTo.get(sq);
    const isDest = !!destMoves;
    const isLastMoveSq = lastMove !== null && (lastMove.from === sq || lastMove.to === sq);
    const isKingChecked = inCheck && kingSquare === sq;
    
    const isHovered = hoveredSquare === sq;
    const isHoveredLegal = isHovered && isDest;

    const baseCls = `
      relative w-full h-full flex items-center justify-center cursor-pointer select-none
      transition-colors duration-150
      ${dark ? 'bg-[#b58863]' : 'bg-[#f0d9b5]'}
    `;

    const pieceId = piece ? idMap[sq] : undefined;

    const canDrag =
      !!piece &&
      piece.color === state.turn &&
      result === '*' &&
      !isAnimating &&
      !pendingPromotion &&
      !(mode === 'ai' && state.turn === 'b');

    const dragProps = canDrag
      ? {
          drag: true as const,
          dragSnapToOrigin: true,
          dragElastic: 0.1,
          dragMomentum: false,
          whileDrag: { 
            scale: 1.15, 
            zIndex: 100, 
            cursor: 'grabbing',
            filter: 'drop-shadow(0px 15px 12px rgba(0,0,0,0.55))',
          },
          style: { touchAction: 'none' as const },
          onDragStart: () => {
            setSelected(sq);
            setIsDragging(true);
          },
          onDrag: (_e: any, info: PanInfo) => {
            const currentOverSq = computeSquareFromPoint(info.point.x, info.point.y);
            if (currentOverSq !== null && destMovesByTo.has(currentOverSq)) {
              setHoveredSquare(currentOverSq);
            } else {
              setHoveredSquare(null);
            }
          },
          onDragEnd: (_e: any, info: PanInfo) => {
            setIsDragging(false);
            setHoveredSquare(null);
            const targetSq = computeSquareFromPoint(info.point.x, info.point.y);
            if (targetSq !== null) {
              handleCellClick(targetSq);
            }
          },
        }
      : {};

    return (
      <div key={sq} className={baseCls} onClick={() => handleCellClick(sq)}>
        {isLastMoveSq && (
          <div className="absolute inset-0 bg-yellow-300/35 pointer-events-none z-0" />
        )}

        {isSelected && !isDragging && (
          <div className="absolute inset-0 bg-emerald-400/25 pointer-events-none z-0" />
        )}

        {isHoveredLegal && (
          <div className="absolute inset-0 bg-emerald-500/20 ring-4 ring-emerald-400/60 ring-inset pointer-events-none z-10" />
        )}

        {isKingChecked && (
          <div className="absolute inset-1 rounded-full bg-red-600/60 blur-[2px] animate-pulse pointer-events-none z-0" />
        )}

        {piece && isSelected && isDragging && (
          <div className="absolute opacity-30 select-none pointer-events-none text-4xl md:text-5xl leading-none z-10">
            <span className={piece.color === 'w' ? 'text-white' : 'text-black'}>
              {unicodeMap[`${piece.color}${piece.type}`]}
            </span>
          </div>
        )}

        <AnimatePresence>
          {piece && pieceId && (
            <motion.div
              key={pieceId}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: isSelected && !isDragging ? 1.05 : 1,
                opacity: isSelected && isDragging ? 0.95 : 1,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`z-20 w-[85%] h-[85%] flex items-center justify-center ${canDrag ? 'cursor-grab' : ''}`}
              {...dragProps}
            >
              <span
                className={`text-4xl md:text-5xl select-none leading-none block transition-all duration-200 ${
                  piece.color === 'w' ? 'text-white' : 'text-black'
                } ${isSelected ? 'drop-shadow-[0_8px_10px_rgba(0,0,0,0.5)]' : 'drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]'}`}
              >
                {unicodeMap[`${piece.color}${piece.type}`]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {isDest && !piece && !isHovered && (
          <div className="absolute w-[28%] h-[28%] bg-white/50 rounded-full pointer-events-none z-10 shadow-sm" />
        )}

        {isDest && piece && (
          <div className="absolute inset-0 m-1.5 border-4 border-[#e11d48]/70 rounded-full pointer-events-none z-30 opacity-90" />
        )}
      </div>
    );
  };

  const whiteScore = state.board.filter(p => p?.color === 'w').length;
  const blackScore = state.board.filter(p => p?.color === 'b').length;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#e8dcc4] gap-4 p-4 lg:p-8 font-sans relative overflow-hidden">
      
      {/* 🎞️ Fundo Vintage Padrão */}
      <div className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply opacity-40"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(58,34,24,0.4)_120%)]" />

      {/* Top Bar HQ Style */}
      <div className="flex w-full max-w-[95vw] lg:max-w-[95vh] items-center justify-between z-10 mb-2">
        <a href="/" className="flex items-center gap-2 bg-[#fdf8ef] border-4 border-[#3a2218] text-[#3a2218] px-4 py-2 rounded-xl font-black uppercase text-sm tracking-widest shadow-[4px_4px_0px_#3a2218] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#3a2218] transition-all">
          <ArrowLeft size={18} strokeWidth={3} /> Sair
        </a>

        {/* Placar estilo Cartaz */}
        <div className="flex items-center gap-6 bg-[#fdf8ef] border-4 border-[#3a2218] px-6 py-2 rounded-xl shadow-[4px_4px_0px_#3a2218]">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-[#4a8b54]">{whiteScore}</span>
            <span className="text-3xl text-[#3a2218]">♔</span>
          </div>
          <div className="w-1 h-6 bg-[#3a2218]/20 rounded-full" />
          <div className="flex items-center gap-2">
            <span className="text-3xl text-[#3a2218]">♚</span>
            <span className="text-xl font-black text-[#e11d48]">{blackScore}</span>
          </div>
        </div>

        <button onClick={restart} className="flex items-center gap-2 bg-[#c49a6c] border-4 border-[#3a2218] text-[#3a2218] px-4 py-2 rounded-xl font-black uppercase text-sm tracking-widest shadow-[4px_4px_0px_#3a2218] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#3a2218] transition-all">
          <RotateCcw size={18} strokeWidth={3} /> <span className="hidden sm:inline">Reiniciar</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 w-full z-10 mt-2">
        
        <div className="flex items-start">
          <div className="flex flex-col justify-around pr-2 h-full aspect-[1/8] max-w-[90vw] lg:max-w-[70vh]" style={{ height: 'min(70vh, 85vw)' }}>
            {[...RANKS].reverse().map((r) => (
              <div key={r} className="flex-1 flex items-center justify-center text-[#3a2218] font-black text-lg">{r}</div>
            ))}
          </div>

          <div className="flex flex-col">
            {/* O Tabuleiro 8x8 — Borda e sombra de Cartola */}
            <div ref={boardRef} className="grid grid-cols-8 grid-rows-8 w-full max-w-[85vw] lg:max-w-[70vh] aspect-square border-8 border-[#3a2218] bg-[#3a2218] shadow-[12px_12px_0px_#3a2218] rounded-lg overflow-hidden relative shrink-0" style={{ touchAction: 'none', height: 'min(70vh, 85vw)', width: 'min(70vh, 85vw)' }}>
              
              {isThematic && (
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-blue-500 border-4 border-[#3a2218] shadow-[4px_4px_0_#3a2218] z-0 pointer-events-none" />
              )}

              {Array.from({ length: 64 }).map((_, i) => {
                const sq = (7 - Math.floor(i / 8)) * 8 + (i % 8);
                return renderSquare(sq);
              })}
              <AnimatePresence>{pendingPromotion && <PromotionPicker color={state.turn} onSelect={handlePromotionSelect} />}</AnimatePresence>
            </div>
            
            <div className="flex justify-around pt-2 w-full">
              {FILES.map((f) => (
                <div key={f} className="flex-1 flex items-center justify-center text-[#3a2218] font-black text-lg uppercase">{f}</div>
              ))}
            </div>
          </div>
        </div>

        <MoveHistory moves={moveHistory} />
      </div>

      {/* Modal Fim de Jogo Cartoon */}
      <AnimatePresence>
        {result !== '*' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <motion.div className="p-8 bg-[#fdf8ef] rounded-3xl shadow-[16px_16px_0px_#1a0e06] text-center w-full max-w-sm border-8 border-[#3a2218]">
              <Trophy size={80} className="mx-auto mb-6 text-[#c49a6c]" />
              <h2 className="text-4xl font-black uppercase tracking-widest text-[#3a2218] mb-2">FIM!</h2>
              <p className="text-xl font-bold text-[#3a2218]/70 mb-8 uppercase tracking-widest">
                {result === '1-0' ? 'Brancas Vencem' : result === '0-1' ? 'Pretas Vencem' : 'Empate'}
              </p>
              <div className="flex flex-col gap-4">
                <button onClick={restart} className="w-full py-4 bg-[#c49a6c] border-4 border-[#3a2218] text-[#3a2218] rounded-xl font-black uppercase tracking-widest shadow-[4px_4px_0px_#3a2218] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#3a2218] transition-all">Revanche</button>
                <a href="/" className="w-full py-4 bg-[#fdf8ef] border-4 border-[#3a2218] text-[#3a2218] rounded-xl font-black uppercase tracking-widest shadow-[4px_4px_0px_#3a2218] hover:bg-[#e8dcc4] transition-all block">Sair</a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
