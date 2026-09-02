'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Game {
  id: string;
  title: string;
  cover: string;
  description: string;
  themeScene: string;
  widthClass?: string;
}

export default function GameBox({ game }: { game: Game }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'MODE' | 'OFFLINE_SELECT' | 'ONLINE_SELECT' | 'OFFLINE_RULES' | 'MACHINE_RULES'>('MODE');
  const [canCaptureBackwards, setCanCaptureBackwards] = useState(true);
  const [kingStopsImmediately, setKingStopsImmediately] = useState(false);
  const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');

  const renderRightHalf = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full flex flex-col justify-center gap-6"
        >
          {step === 'MODE' && (
            <div className="flex flex-col gap-4">
              <h2 className="text-4xl font-black uppercase tracking-widest text-[#3a2218] text-center mb-4">{game.title}</h2>
              <button 
                onClick={() => setStep('OFFLINE_SELECT')}
                className="bg-[#c49a6c] hover:bg-[#a67c4d] text-[#3a2218] py-5 rounded-lg font-black text-xl uppercase tracking-widest shadow-xl border-4 border-[#3a2218] hover:-translate-y-1 transition-all"
              >
                Offline
              </button>
              <button 
                onClick={() => setStep('ONLINE_SELECT')}
                className="bg-[#c49a6c] hover:bg-[#a67c4d] text-[#3a2218] py-5 rounded-lg font-black text-xl uppercase tracking-widest shadow-xl border-4 border-[#3a2218] hover:-translate-y-1 transition-all"
              >
                Online
              </button>
            </div>
          )}

          {step === 'OFFLINE_SELECT' && (
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => game.id === 'xadrez' ? window.location.href = '/game/xadrez?mode=offline' : setStep('OFFLINE_RULES')}
                className="bg-[#c49a6c] hover:bg-[#a67c4d] text-[#3a2218] py-5 rounded-lg font-black text-xl uppercase tracking-widest shadow-xl border-4 border-[#3a2218] hover:-translate-y-1 transition-all"
              >
                Joga e Passa
              </button>
              <button 
                onClick={() => game.id === 'xadrez' ? window.location.href = '/game/xadrez?mode=ai&difficulty=medio' : setStep('MACHINE_RULES')}
                className="bg-[#c49a6c] hover:bg-[#a67c4d] text-[#3a2218] py-5 rounded-lg font-black text-xl uppercase tracking-widest shadow-xl border-4 border-[#3a2218] hover:-translate-y-1 transition-all"
              >
                Contra a Máquina
              </button>
              <button onClick={() => setStep('MODE')} className="text-[#3a2218] underline font-bold mt-2 self-center hover:text-black">
                Voltar
              </button>
            </div>
          )}

          {step === 'OFFLINE_RULES' && (
            <div className="flex flex-col gap-4 bg-[#fdf8ef] p-4 rounded-lg border-4 border-[#3a2218]">
              <h3 className="text-[#3a2218] font-black uppercase tracking-widest text-lg text-center mb-2">Joga e Passa</h3>
              
              <div className="flex flex-col gap-2">
                {game.id === 'damas' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[#3a2218] font-bold text-sm">Comer para trás:</span>
                      <button 
                        onClick={() => setCanCaptureBackwards(!canCaptureBackwards)}
                        className={`px-3 py-1 rounded font-black text-xs uppercase border-2 ${canCaptureBackwards ? 'bg-emerald-500 border-emerald-700 text-white' : 'bg-rose-500 border-rose-700 text-white'}`}
                      >
                        {canCaptureBackwards ? 'LIGADO' : 'DESLIGADO'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#3a2218] font-bold text-sm leading-tight max-w-[60%]">
                        Parada da Dama voadora após comer:
                      </span>
                      <button 
                        onClick={() => setKingStopsImmediately(!kingStopsImmediately)}
                        className={`px-3 py-1 rounded font-black text-xs uppercase border-2 text-white ${kingStopsImmediately ? 'bg-[#3a2218] border-black' : 'bg-[#c49a6c] border-[#3a2218]'}`}
                      >
                        {kingStopsImmediately ? '1ª CASA' : 'QUALQUER'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <a 
                href={`/game/${game.id}?mode=offline&backwards=${canCaptureBackwards}&kingStops=${kingStopsImmediately}`}
                className="mt-4 bg-[#4a8b54] text-center text-[#fdf8ef] py-3 rounded-lg font-black text-lg uppercase tracking-widest shadow-xl border-4 border-[#1e3b22] hover:bg-[#3a6e42] hover:scale-105 active:scale-95 transition-all"
              >
                Vamos Começar!
              </a>

              <button 
                onClick={() => setStep('OFFLINE_SELECT')}
                className="bg-[#c49a6c] hover:bg-[#a67c4d] text-[#3a2218] py-5 rounded-lg font-black text-xl uppercase tracking-widest shadow-xl border-4 border-[#3a2218] hover:-translate-y-1 transition-all"
              >
                Offline
              </button>
            </div>
          )}

          {step === 'MACHINE_RULES' && (
            <div className="flex flex-col gap-4 bg-[#fdf8ef] p-4 rounded-lg border-4 border-[#3a2218]">
              <h3 className="text-[#3a2218] font-black uppercase tracking-widest text-lg text-center mb-2">Contra a Máquina</h3>
              
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1 mb-2">
                  <span className="text-[#3a2218] font-bold text-sm text-center">Dificuldade:</span>
                  <div className="flex justify-between gap-1">
                    <button onClick={() => setDifficulty('facil')} className={`flex-1 py-1 rounded font-black text-xs uppercase border-2 ${difficulty === 'facil' ? 'bg-emerald-500 border-emerald-700 text-white' : 'bg-transparent border-[#3a2218] text-[#3a2218]'}`}>Fácil</button>
                    <button onClick={() => setDifficulty('medio')} className={`flex-1 py-1 rounded font-black text-xs uppercase border-2 ${difficulty === 'medio' ? 'bg-yellow-500 border-yellow-700 text-white' : 'bg-transparent border-[#3a2218] text-[#3a2218]'}`}>Médio</button>
                    <button onClick={() => setDifficulty('dificil')} className={`flex-1 py-1 rounded font-black text-xs uppercase border-2 ${difficulty === 'dificil' ? 'bg-rose-500 border-rose-700 text-white' : 'bg-transparent border-[#3a2218] text-[#3a2218]'}`}>Difícil</button>
                  </div>
                </div>

                {game.id === 'damas' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[#3a2218] font-bold text-sm">Comer para trás:</span>
                      <button 
                        onClick={() => setCanCaptureBackwards(!canCaptureBackwards)}
                        className={`px-3 py-1 rounded font-black text-xs uppercase border-2 ${canCaptureBackwards ? 'bg-emerald-500 border-emerald-700 text-white' : 'bg-rose-500 border-rose-700 text-white'}`}
                      >
                        {canCaptureBackwards ? 'LIGADO' : 'DESLIGADO'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#3a2218] font-bold text-sm leading-tight max-w-[60%]">
                        Parada da Dama voadora após comer:
                      </span>
                      <button 
                        onClick={() => setKingStopsImmediately(!kingStopsImmediately)}
                        className={`px-3 py-1 rounded font-black text-xs uppercase border-2 text-white ${kingStopsImmediately ? 'bg-[#3a2218] border-black' : 'bg-[#c49a6c] border-[#3a2218]'}`}
                      >
                        {kingStopsImmediately ? '1ª CASA' : 'QUALQUER'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <a 
                href={`/game/${game.id}?mode=ai&difficulty=${difficulty}&backwards=${canCaptureBackwards}&kingStops=${kingStopsImmediately}`}
                className="mt-4 bg-[#4a8b54] text-center text-[#fdf8ef] py-3 rounded-lg font-black text-lg uppercase tracking-widest shadow-xl border-4 border-[#1e3b22] hover:bg-[#3a6e42] hover:scale-105 active:scale-95 transition-all"
              >
                Vamos Começar!
              </a>

              <button 
                onClick={() => setStep('OFFLINE_SELECT')}
                className="bg-[#c49a6c] hover:bg-[#a67c4d] text-[#3a2218] py-5 rounded-lg font-black text-xl uppercase tracking-widest shadow-xl border-4 border-[#3a2218] hover:-translate-y-1 transition-all"
              >
                Offline
              </button>
            </div>
          )}

          {step === 'ONLINE_SELECT' && (
            <div className="flex flex-col gap-4">
              <button 
                className="bg-[#4a8b54] opacity-50 cursor-not-allowed text-[#fdf8ef] py-5 rounded-lg font-black text-xl uppercase tracking-widest shadow-xl border-4 border-[#1e3b22]"
              >
                Criar Sala
              </button>
              <button 
                className="bg-[#4a8b54] opacity-50 cursor-not-allowed text-[#fdf8ef] py-5 rounded-lg font-black text-xl uppercase tracking-widest shadow-xl border-4 border-[#1e3b22]"
              >
                Entrar na Sala
              </button>
              <button onClick={() => setStep('MODE')} className="text-[#3a2218] underline font-bold mt-2 self-center hover:text-black">
                Voltar
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="flex flex-col items-center justify-end h-full">
      
      {!isOpen && (
        <motion.div
          layoutId={`box-${game.id}`}
          whileHover={{ scale: 1.05, rotateZ: 2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className={`bg-[#e8dcc4] rounded-lg shadow-2xl cursor-pointer border-4 border-[#3a2218] flex flex-col items-center justify-center text-[#3a2218] font-bold text-center relative overflow-hidden shrink-0 ${!game.cover ? 'w-56 h-72' : ''}`}
        >
          {game.cover ? (
            <img src={game.cover} alt={game.title} className="w-64 md:w-72 h-auto opacity-90 block" />
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center gap-2">
              <span className="text-4xl">❓</span>
              <p className="text-xl leading-tight">{game.title.toUpperCase()}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-[#c49a6c] mix-blend-color-burn opacity-30 pointer-events-none" />
        </motion.div>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-vintage">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" 
            />
            
            <motion.div 
              layoutId={`box-${game.id}`}
              className={`w-full bg-[#f4ebd8] rounded-3xl shadow-2xl border-8 border-[#3a2218] flex p-8 gap-8 relative z-10 overflow-hidden min-h-[500px] ${game.id === 'xadrez' ? 'max-w-xl flex-col items-center' : 'max-w-4xl'}`}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#e8dcc4] to-[#c49a6c] pointer-events-none" />

              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 bg-[#a73a3a] hover:bg-[#8b2b2b] text-[#f4ebd8] rounded-full w-12 h-12 font-black text-xl shadow-lg border-4 border-[#3a2218] flex items-center justify-center transition z-50 hover:scale-110 active:scale-95"
              >
                X
              </button>

              <div className={`${game.id === 'xadrez' ? 'w-full border-b-4 border-[#3a2218]/20 pb-8 flex justify-center relative z-10' : 'w-1/2 flex items-center justify-center relative z-10 border-r-4 border-[#3a2218]/20 pr-8'}`}>
                <a 
                  href={`/manual/${game.id}`}
                  title="Ler Manual Completo"
                  className={`block rounded-xl border-4 border-[#3a2218] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden bg-[#c49a6c] ${game.id === 'xadrez' ? 'w-full max-w-lg' : 'w-full max-w-sm'}`}
                >
                  <img src={game.id === 'xadrez' ? '/manual-xadrez.jpg' : '/manual-cover.jpg'} alt="Manual de Instruções" className="w-full h-auto object-cover" />
                </a>
              </div>

              <div className={`${game.id === 'xadrez' ? 'w-full flex flex-col justify-center relative z-10' : 'w-1/2 flex flex-col justify-center relative z-10 pl-4'}`}>
                {renderRightHalf()}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}









