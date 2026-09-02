'use client';
import React, { useEffect, useRef } from 'react';

interface Props {
  moves: string[]; 
}

export default function MoveHistory({ moves }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length]);

  const rounds: { number: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    rounds.push({ number: i / 2 + 1, white: moves[i], black: moves[i + 1] });
  }

  return (
    <div className="w-full lg:w-56 bg-[#fdf8ef] border-4 border-[#3a2218] rounded-xl shadow-[8px_8px_0px_#3a2218] flex flex-col h-[200px] lg:h-[min(70vh,85vw)] overflow-hidden relative">
      
      {/* Cabeçalho */}
      <div className="bg-[#3a2218] text-[#c49a6c] py-3 px-4 font-black uppercase tracking-widest text-sm text-center border-b-4 border-[#3a2218]">
        Registro
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm space-y-2"
      >
        {rounds.length === 0 && (
          <div className="text-center text-[#3a2218]/40 py-4 font-bold uppercase tracking-widest text-xs">
            Nenhum lance
          </div>
        )}

        {rounds.map((r) => (
          <div key={r.number} className="flex justify-between border-b-2 border-[#3a2218]/10 pb-1">
            <span className="text-[#3a2218]/50 font-black">{r.number}.</span>
            <span className="font-black text-[#3a2218]">{r.white}</span>
            <span className="font-black text-[#3a2218]/80 pr-2">{r.black || '...'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
