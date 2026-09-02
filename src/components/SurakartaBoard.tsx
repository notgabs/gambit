'use client';
import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function SurakartaBoard() {
  return (
    <div className="min-h-screen bg-[#e8dcc4] flex flex-col items-center justify-center font-sans p-4 relative overflow-hidden">
      
      {/* 🎞️ Fundo Vintage Padrão */}
      <div className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply opacity-40"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(58,34,24,0.4)_120%)]" />

      {/* Top Bar HQ Style */}
      <div className="flex w-full max-w-[95vw] lg:max-w-[70vh] items-center justify-between z-10 mb-8">
        <a href="/" className="flex items-center gap-2 bg-[#fdf8ef] border-4 border-[#3a2218] text-[#3a2218] px-4 py-2 rounded-xl font-black uppercase text-sm tracking-widest shadow-[4px_4px_0px_#3a2218] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#3a2218] transition-all">
          <ArrowLeft size={18} strokeWidth={3} /> Sair
        </a>
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#fdf8ef] border-8 border-[#3a2218] rounded-3xl p-8 shadow-[16px_16px_0px_#1a0e06] text-center flex flex-col items-center">
        <h2 className="text-4xl font-black uppercase tracking-widest text-[#3a2218] mb-4">
          EM BREVE
        </h2>
        <p className="text-[#3a2218] font-bold text-lg leading-relaxed">
          O tabuleiro de Surakarta está sendo construído. Aguarde as próximas atualizações!
        </p>
      </div>

    </div>
  );
}
