'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Cpu, Users, BookOpen, X, Settings2 } from 'lucide-react';
import Link from 'next/link';

const GAMES = [
  {
    id: 'xadrez',
    title: 'Xadrez',
    cover: '/cover-xadrez.png',
    className: 'aspect-[16/9] w-[320px] md:w-[480px]', 
  },
  {
    id: 'damas',
    title: 'Damas',
    cover: '/cover-damas.png',
    className: 'aspect-[3/4] w-[220px] md:w-[320px]', 
  },
  {
    id: 'adugo',
    title: 'Adugo',
    cover: '/cover-adugo.jpg',
    className: 'aspect-square w-[260px] md:w-[320px]',
  },
  {
    id: 'surakarta',
    title: 'Surakarta',
    cover: '/cover-surakarta.jpg',
    className: 'aspect-[3/4] w-[220px] md:w-[320px]',
  }
];

export default function VintageLobby() {
  const [selected, setSelected] = useState<typeof GAMES[0] | null>(null);
  const [step, setStep] = useState<'MODE' | 'OFFLINE_RULES' | 'MACHINE_RULES'>('MODE');
  const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');

  // Seleção de Lado no Adugo (VS IA)
  const [adugoSide, setAdugoSide] = useState<'onca' | 'cao'>('onca');

  // Regras de Damas
  const [canCaptureBackwards, setCanCaptureBackwards] = useState(true);
  const [kingStopsImmediately, setKingStopsImmediately] = useState(false);

  const openGame = (game: typeof GAMES[0]) => {
    setSelected(game);
    setStep('MODE');
  };

  const closeGame = () => {
    setSelected(null);
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 md:p-8 font-sans overflow-hidden bg-[#e8dcc4]">
      
      {/* 🎞️ Fundo Vintage */}
      <div className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply opacity-40"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
           }}
      />
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(58,34,24,0.6)_120%)]" />

      {/* 🎪 Cabeçalho */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="relative z-10 mb-12 text-center"
      >
        <h1 className="text-6xl md:text-8xl font-black text-[#fdf8ef] tracking-widest uppercase drop-shadow-[4px_4px_0px_#3a2218] md:drop-shadow-[8px_8px_0px_#3a2218]" style={{ fontFamily: 'var(--font-vintage, cursive)' }}>
          Gambit
        </h1>
        <p className="text-[#3a2218] font-black uppercase tracking-[0.3em] mt-4 bg-[#c49a6c] inline-block px-6 py-2 rounded-full border-4 border-[#3a2218] shadow-[4px_4px_0px_#3a2218]">
          Clube de Jogos
        </p>
      </motion.div>

      {/* 🃏 Pôsteres dos Jogos */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-5xl">
        {GAMES.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: 'spring', bounce: 0.5 }}
            whileHover={{ scale: 1.05, rotateZ: i % 2 === 0 ? 3 : -3, y: -10 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openGame(game)}
            className={`relative bg-[#3a2218] border-[6px] md:border-8 border-[#3a2218] rounded-2xl overflow-hidden cursor-pointer shadow-[8px_8px_0px_#3a2218] hover:shadow-[16px_16px_0px_#3a2218] hover:border-[#c49a6c] transition-colors duration-300 ${game.className}`}
          >
            <img 
              src={game.cover} 
              alt={game.title} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* 🎬 MODAL DE SELEÇÃO */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeGame}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="relative w-full max-w-md bg-[#fdf8ef] border-8 border-[#3a2218] rounded-3xl p-6 shadow-[16px_16px_0px_#1a0e06] overflow-hidden"
            >
              <button 
                onClick={closeGame}
                className="absolute top-4 right-4 w-10 h-10 bg-[#e11d48] border-4 border-[#3a2218] rounded-full flex items-center justify-center text-white hover:bg-red-500 hover:scale-110 active:scale-90 transition-all z-10 shadow-[4px_4px_0px_#3a2218]"
              >
                <X size={20} strokeWidth={4} />
              </button>

              <div className="relative z-10 flex flex-col gap-6">
                <div className="text-center border-b-4 border-[#3a2218] pb-4 pr-8">
                  <h2 className="text-4xl font-black uppercase tracking-widest text-[#3a2218]">
                    {selected.title}
                  </h2>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-4"
                  >
                    {/* TELA 1: MODO DE JOGO */}
                    {step === 'MODE' && (
                      <>
                        <button 
                          onClick={() => {
                            if (selected.id === 'damas') {
                              setStep('OFFLINE_RULES');
                            } else {
                              window.location.href = `/game/${selected.id}?mode=offline`;
                            }
                          }}
                          className="w-full flex items-center justify-between p-4 bg-[#e8dcc4] border-4 border-[#3a2218] rounded-xl hover:bg-[#c49a6c] hover:-translate-y-1 transition-all shadow-[4px_4px_0px_#3a2218] group"
                        >
                          <div className="flex items-center gap-3">
                            <Users size={24} className="text-[#3a2218]" />
                            <span className="font-black text-[#3a2218] uppercase tracking-widest text-lg">2 Jogadores</span>
                          </div>
                          <Play size={20} className="text-[#3a2218] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        {selected.id !== 'surakarta' && (
                          <button 
                            onClick={() => selected.id === 'xadrez' 
                              ? window.location.href = `/game/xadrez?mode=ai&difficulty=${difficulty}` 
                              : setStep('MACHINE_RULES')}
                            className="w-full flex items-center justify-between p-4 bg-[#3a2218] border-4 border-[#3a2218] rounded-xl hover:bg-black hover:-translate-y-1 transition-all shadow-[4px_4px_0px_#c49a6c] group"
                          >
                            <div className="flex items-center gap-3">
                              <Cpu size={24} className="text-[#fdf8ef]" />
                              <span className="font-black text-[#fdf8ef] uppercase tracking-widest text-lg">Jogar vs IA</span>
                            </div>
                            <Play size={20} className="text-[#fdf8ef] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}

                        <Link 
                          href={`/manual/${selected.id}`}
                          className="w-full flex items-center justify-center gap-2 p-3 mt-2 bg-transparent border-4 border-dashed border-[#c49a6c] rounded-xl hover:bg-[#c49a6c]/20 hover:border-solid transition-all"
                        >
                          <BookOpen size={18} className="text-[#3a2218]" />
                          <span className="font-black text-[#3a2218] uppercase tracking-widest text-sm">Ler o Manual</span>
                        </Link>
                      </>
                    )}

                    {/* TELA 2: REGRAS DAMAS (OFFLINE) */}
                    {step === 'OFFLINE_RULES' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-[#3a2218] font-black uppercase border-b-2 border-[#3a2218]/20 pb-2">
                          <Settings2 size={20} /> Regras da Casa
                        </div>

                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border-2 border-[#3a2218]">
                          <span className="font-black text-[#3a2218] uppercase text-sm">Comer p/ trás:</span>
                          <button 
                            onClick={() => setCanCaptureBackwards(!canCaptureBackwards)}
                            className={`px-4 py-2 rounded-md font-black text-xs uppercase border-2 transition-all ${canCaptureBackwards ? 'bg-[#4a8b54] border-[#1e3b22] text-white shadow-[2px_2px_0px_#1e3b22]' : 'bg-[#e11d48] border-[#7a1029] text-white shadow-[2px_2px_0px_#7a1029]'}`}
                          >
                            {canCaptureBackwards ? 'Ativado' : 'Desativado'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border-2 border-[#3a2218]">
                          <span className="font-black text-[#3a2218] uppercase text-sm">Dama Voadora:</span>
                          <button 
                            onClick={() => setKingStopsImmediately(!kingStopsImmediately)}
                            className={`px-4 py-2 rounded-md font-black text-xs uppercase border-2 transition-all text-[#fdf8ef] ${kingStopsImmediately ? 'bg-[#3a2218] border-black shadow-[2px_2px_0px_#000]' : 'bg-[#c49a6c] border-[#8b6234] shadow-[2px_2px_0px_#8b6234]'}`}
                          >
                            {kingStopsImmediately ? 'Para Logo' : 'Vai Longe'}
                          </button>
                        </div>

                        <a 
                          href={`/game/${selected.id}?mode=offline&backwards=${canCaptureBackwards}&kingStops=${kingStopsImmediately}`}
                          className="w-full mt-4 flex items-center justify-center p-4 bg-[#4a8b54] border-4 border-[#1e3b22] rounded-xl hover:bg-[#3d7245] hover:-translate-y-1 transition-all shadow-[4px_4px_0px_#1e3b22]"
                        >
                          <span className="font-black text-[#fdf8ef] uppercase tracking-widest text-xl">Começar Jogo</span>
                        </a>

                        <button onClick={() => setStep('MODE')} className="text-xs font-black text-[#3a2218]/60 underline hover:text-black uppercase tracking-wider text-center mt-2">
                          Voltar
                        </button>
                      </div>
                    )}

                    {/* TELA 3: REGRAS MÁQUINA (Damas e Adugo) */}
                    {step === 'MACHINE_RULES' && (
                      <div className="flex flex-col gap-4">
                        {/* Seletor de Dificuldade */}
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-black text-[#3a2218] uppercase tracking-wider">Dificuldade da IA:</span>
                          <div className="flex justify-between gap-2">
                            {['facil', 'medio', 'dificil'].map((diff) => (
                              <button
                                key={diff}
                                onClick={() => setDifficulty(diff as any)}
                                className={`flex-1 py-2.5 rounded-lg font-black text-xs uppercase border-4 transition-all ${
                                  difficulty === diff 
                                    ? 'bg-[#c49a6c] border-[#3a2218] text-[#3a2218] shadow-[3px_3px_0px_#3a2218] -translate-y-0.5' 
                                    : 'bg-[#e8dcc4] border-[#3a2218]/30 text-[#3a2218]/50 hover:bg-[#c49a6c]/30'
                                }`}
                              >
                                {diff}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Opção Exclusiva do Adugo: Escolha do Lado */}
                        {selected.id === 'adugo' && (
                          <div className="flex flex-col gap-2 bg-white/60 p-3 rounded-xl border-2 border-[#3a2218]">
                            <span className="text-xs font-black text-[#3a2218] uppercase tracking-wider text-center">Jogar Como:</span>
                            <div className="flex justify-between gap-2">
                              <button
                                onClick={() => setAdugoSide('onca')}
                                className={`flex-1 py-2.5 rounded-lg font-black text-xs uppercase border-4 transition-all ${
                                  adugoSide === 'onca' 
                                    ? 'bg-[#f0c33c] border-[#3a2218] text-[#3a2218] shadow-[3px_3px_0px_#3a2218] -translate-y-0.5' 
                                    : 'bg-[#e8dcc4] border-[#3a2218]/30 text-[#3a2218]/50'
                                }`}
                              >
                                Onça 🐆
                              </button>
                              <button
                                onClick={() => setAdugoSide('cao')}
                                className={`flex-1 py-2.5 rounded-lg font-black text-xs uppercase border-4 transition-all ${
                                  adugoSide === 'cao' 
                                    ? 'bg-[#3a2218] border-black text-[#fdf8ef] shadow-[3px_3px_0px_#000] -translate-y-0.5' 
                                    : 'bg-[#e8dcc4] border-[#3a2218]/30 text-[#3a2218]/50'
                                }`}
                              >
                                Cães 🐺
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Opções de Damas */}
                        {selected.id === 'damas' && (
                          <div className="flex flex-col gap-2">
                             <div className="flex items-center justify-between bg-white p-3 rounded-lg border-2 border-[#3a2218]">
                              <span className="font-black text-[#3a2218] uppercase text-sm">Comer p/ trás:</span>
                              <button 
                                onClick={() => setCanCaptureBackwards(!canCaptureBackwards)}
                                className={`px-4 py-2 rounded-md font-black text-xs uppercase border-2 transition-all ${canCaptureBackwards ? 'bg-[#4a8b54] border-[#1e3b22] text-white shadow-[2px_2px_0px_#1e3b22]' : 'bg-[#e11d48] border-[#7a1029] text-white shadow-[2px_2px_0px_#7a1029]'}`}
                              >
                                {canCaptureBackwards ? 'Sim' : 'Não'}
                              </button>
                            </div>
                          </div>
                        )}

                        <a 
                          href={
                            selected.id === 'adugo'
                              ? `/game/adugo?mode=ai&difficulty=${difficulty}&side=${adugoSide}`
                              : `/game/${selected.id}?mode=ai&difficulty=${difficulty}&backwards=${canCaptureBackwards}&kingStops=${kingStopsImmediately}`
                          }
                          className="w-full mt-2 flex items-center justify-center p-4 bg-[#3a2218] border-4 border-black rounded-xl hover:bg-black hover:-translate-y-1 transition-all shadow-[4px_4px_0px_#c49a6c]"
                        >
                          <span className="font-black text-[#fdf8ef] uppercase tracking-widest text-xl">Lutar vs Máquina</span>
                        </a>

                        <button onClick={() => setStep('MODE')} className="text-xs font-black text-[#3a2218]/60 underline hover:text-black uppercase tracking-wider text-center mt-1">
                          Voltar
                        </button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
