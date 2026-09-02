import { useState, useEffect, useRef } from 'react';
import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Cell } from '@/types/checkers';

type Props = {
  cell: Cell;
  isSelected?: boolean;
  isJustPromoted?: boolean;
};

export default function Piece({ cell, isSelected = false, isJustPromoted = false }: Props) {
  const isGreen = cell > 0;
  const isKing = Math.abs(cell) === 2;

  const [isFlipping, setIsFlipping] = useState(false);
  const [showCrown, setShowCrown] = useState(isKing && !isJustPromoted);

  useEffect(() => {
    // Se a peça acaba de ser promovida, roda o flip!
    if (isJustPromoted) {
      setIsFlipping(true);
      
      // 800ms = 720 graus. 500ms = 450 graus (exatamente de quina/borda para a câmera)
      // A coroa aparece quando a moeda está "fina" na tela, então o fade in é invisível!
      const crownTimer = setTimeout(() => setShowCrown(true), 500);
      const endTimer = setTimeout(() => setIsFlipping(false), 800);
      
      return () => {
        clearTimeout(crownTimer);
        clearTimeout(endTimer);
      };
    } else {
      // Quando não é promoção (ex: reiniciou o jogo ou carregou save)
      // Sincronizamos a coroa e paramos de girar imediatamente
      setShowCrown(isKing);
      setIsFlipping(false);
    }
  }, [isKing, isJustPromoted]);

  // A cor deve continuar a mesma para a dama, sem clarear
  const bg = isGreen ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <motion.div
      initial={false}
      animate={isFlipping ? {
        rotateX: [0, 360, 720], // Gira em torno do próprio eixo X (moeda)
        scale: [1, 1.8, 1],     // Eixo Z: aproxima da câmera simulando altura
        boxShadow: [
          "0px 4px 6px rgba(0,0,0,0.1)",
          "0px 40px 30px rgba(0,0,0,0.4)", // Sombra grande = objeto alto
          "0px 8px 16px rgba(0,0,0,0.4)"
        ],
        filter: "brightness(1)"
      } : {
        rotateX: isKing ? 720 : 0, // Mantém em 720 para não girar de volta ao aterrissar!
        scale: isSelected ? 1.1 : 1,
        boxShadow: isSelected ? "0px 8px 16px rgba(0,0,0,0.4)" : "0px 4px 6px rgba(0,0,0,0.1)",
        filter: isSelected ? "brightness(1.1)" : "brightness(1)"
      }}
      transition={isFlipping ? { duration: 0.8, ease: "easeInOut" } : { duration: 0.2 }}
      className={`
        ${bg}
        w-[75%] aspect-square
        rounded-full
        flex items-center justify-center
        border-2 border-black/10
        ${!isFlipping && 'hover:brightness-105'}
      `}
    >
      {showCrown && <Crown className="w-[60%] h-[60%] text-black/50" strokeWidth={3} />}
    </motion.div>
  );
}
