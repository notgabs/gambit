import ChessBoard from '@/components/ChessBoard';
import { Suspense } from 'react';

export const metadata = {
  title: 'Gambit - Xadrez',
  description: 'Jogue Xadrez contra o computador ou um amigo',
};

export default function ChessGame() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#9ce5e5] flex items-center justify-center font-bold text-[#3a2218]">Carregando Tabuleiro...</div>}>
      <ChessBoard />
    </Suspense>
  );
}
