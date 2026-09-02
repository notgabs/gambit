# GAMBIT - Documentação e Escopo Completo do Projeto

Este documento detalha as ideias, a arquitetura e contém o código-fonte integral de todos os arquivos do projeto Gambit (Xadrez e Damas com IA nativa no navegador). 
Ele serve como uma cópia de segurança e um guia completo de leitura para revisores que não possuem acesso direto aos arquivos do repositório.

---

## 1. Ideias e Objetivos do Projeto

O **Gambit** é uma plataforma de jogos de tabuleiro clássicos (Xadrez e Damas) desenvolvida para a web moderna utilizando **Next.js 14**, **React**, e **TypeScript**.
O diferencial tecnológico do projeto é possuir **motores de regra 100% locais (offline)** e **Inteligência Artificial nativa** rodando no próprio navegador através de **Web Workers**, sem qualquer dependência de servidores externos (backends, APIs de xadrez) para validar regras ou calcular as jogadas da IA.

### Principais Características:
- **Motores de Jogo FIDE / Regras Oficiais:** Ambos os motores foram construídos do zero no front-end. O xadrez suporta en passant, roque, promoção, regra dos 50 lances e empate por repetição (3-fold). O motor de damas suporta capturas múltiplas, obrigatoriedade de captura (backwards) e afogamento.
- **Inteligência Artificial (Minimax + Alpha-Beta Pruning):** A IA avalia as jogadas usando uma árvore de busca com poda Alpha-Beta e Transposition Tables (TT) para evitar recálculos. Ela roda em um Web Worker, garantindo que a thread principal da interface (UI) nunca trave enquanto a IA "pensa".
- **Interface Fluida e Moderna:** Utiliza Tailwind CSS para estilização e Framer Motion para animações ricas (arrastar e soltar suave, peças elásticas, animação das peças pelo tabuleiro, ghost pieces).
- **Efeitos Sonoros Reais:** Integração usando samples originais de peças de xadrez do Chess.com (foley) com clonagem de instâncias para lidar com lances sobrepostos (capturas).
- **Notação e Histórico:** Histórico de jogadas lateral em tempo real usando a Notação Algébrica Padrão (SAN), com suporte completo a desambiguação e marcadores de xeque/mate.
- **Manuários Interativos e Temáticos:** Páginas de regras detalhadas com design vintage inspirado em livros de regras clássicos.
- **Menu de Seleção e Unboxing em 3D:** Ambiente imersivo representando um sótão onde o jogador retira o jogo da estante e o abre na mesa.

---

## 2. Arquitetura do Sistema

O projeto é dividido em camadas claras:

1. **Camada de UI / Componentes (src/components/, src/app/)**
   - Renderiza os tabuleiros (ChessBoard.tsx, CheckersBoard.tsx).
   - Sótão e menu 3D (AtticScene.tsx, Shelf.tsx, GameTable.tsx).
   - Lida com eventos de clique, drag & drop (Framer Motion).
   - Controla o estado local (de quem é a vez, histórico, placar, notação SAN).

2. **Motores de Regra (Game Engines) (src/lib/chess/, src/lib/engine/)**
   - Classes e funções puras que recebem um estado e retornam os lances legais, ou aplicam um lance e retornam o novo estado.
   - Não possuem dependência de React. São testáveis e altamente otimizadas.

3. **Motores de IA (src/lib/chess/ai/, src/lib/ai/)**
   - Funções de avaliação (PST - Piece-Square Tables).
   - Algoritmo Minimax.
   - Gerenciadores de Web Workers (worker.ts) e wrappers assíncronos (skAI.ts) para comunicar a UI com a thread de IA.

---

## 3. Código-Fonte Completo

Abaixo estão todos os arquivos TypeScript (.ts e .tsx) do projeto, organizados por diretório.

### Arquivo: .\src\app\game\damas\page.tsx
``typescript
import React from 'react';
import CheckersBoard from '@/components/CheckersBoard';
import gamesData from '../../../../public/games.json';

async function getGame() {
  return gamesData.find((g: any) => g.id === 'damas');
}

export default async function DamasPage() {
  const game = await getGame();

  if (!game) {
    return <div>Jogo nao encontrado!</div>;
  }

  return (
    <div className="h-screen w-screen bg-[#9ce5e5] relative flex overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c4f2f2] to-[#60b9b9] pointer-events-none" />
      
      <React.Suspense fallback={<div className="m-auto text-[#3a2218] font-black text-2xl">Carregando Tabuleiro...</div>}>
        <CheckersBoard />
      </React.Suspense>
    </div>
  );
}

``


### Arquivo: .\src\app\game\xadrez\page.tsx
``typescript
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

``


### Arquivo: 
``typescript
import React from 'react';
import Link from 'next/link';

export default async function ManualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (id === 'damas') {
    return (
      <div className="min-h-screen bg-[#9ce5e5] text-[#3a2218] p-4 md:p-8 relative flex justify-center font-sans">
        <div className="fixed inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c4f2f2] to-[#60b9b9] pointer-events-none" />
        
        <div className="w-full max-w-5xl z-10 bg-[#fdf8ef] rounded-xl shadow-2xl border-4 border-[#1e3b22] flex flex-col p-6 md:p-10 h-fit my-auto relative mt-8 md:mt-auto">
          
          <Link 
            href={`/?open=${id}`} 
            className="absolute -top-6 -right-6 bg-[#4a8b54] text-[#fdf8ef] w-14 h-14 flex items-center justify-center rounded-full font-black shadow-xl hover:bg-[#3a6e42] hover:scale-110 active:scale-95 transition-all border-4 border-[#1e3b22] text-2xl"
            title="Fechar Manual"
          >
            X
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-[#2a5a3b] uppercase tracking-wide mb-2 flex items-center gap-3 border-b-2 border-[#86c4a3] pb-2">
                <span className="bg-[#4a8b54] text-[#fdf8ef] w-8 h-8 flex items-center justify-center rounded-full text-lg shrink-0">1</span> 
                Como Jogar
              </h2>

              <section className="bg-white p-5 rounded-lg border-2 border-[#86c4a3] shadow-sm">
                <h3 className="text-lg font-bold mb-2 text-[#1e3b22]">Objetivo & Tabuleiro</h3>
                <p className="text-base font-medium mb-2 text-slate-700">Capture todas as peças do adversário para vencer a partida.</p>
                <p className="text-base font-medium text-slate-700">O jogo acontece em um tabuleiro 8x8. As peças se movem apenas nas <strong>casas escuras</strong> na diagonal.</p>
              </section>

              <section className="bg-white p-5 rounded-lg border-2 border-[#86c4a3] shadow-sm">
                <h3 className="text-lg font-bold mb-2 text-[#1e3b22]">Peças e Damas</h3>
                <p className="text-base font-medium mb-2 text-slate-700">Peças normais andam apenas uma casa por vez, para frente.</p>
                <p className="text-base font-medium mb-2 text-slate-700">Ao alcançar a última fileira do lado adversário, a peça é transformada em Dama. Ela ganha a habilidade de andar várias casas de uma vez, tanto para frente quanto para trás.</p>
                <p className="text-base font-medium text-slate-700">Após a Dama capturar uma peça e houver casas vazias mais a frente, ela poderá escolher aonde ficar. Não precisa ficar necessariamente na primeira casa após a captura.</p>
              </section>
            </div>

            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-[#2a5a3b] uppercase tracking-wide mb-2 flex items-center gap-3 border-b-2 border-[#86c4a3] pb-2">
                <span className="bg-[#4a8b54] text-[#fdf8ef] w-8 h-8 flex items-center justify-center rounded-full text-lg shrink-0">2</span> 
                Regras do Jogo
              </h2>

              <section className="bg-[#e6f4f4] p-5 rounded-lg border-2 border-[#4a8b54] shadow-md">
                <h3 className="text-lg font-bold mb-3 text-[#1e3b22]">Regras de Captura</h3>
                <ul className="list-disc list-outside ml-5 space-y-2 text-base font-medium text-slate-800">
                  <li>A captura é obrigatória. Se puder comer, deve comer.</li>
                  <li>Se após capturar houver outra captura disponível com a mesma peça, você deve continuar o combo (multi-captura).</li>
                  <li>Se duas peças puderem comer uma peça adversária, você é obrigado a escolher o caminho que capture o maior número de peças.</li>
                </ul>
              </section>

              <section className="bg-[#fdf3d8] p-5 rounded-lg border-2 border-[#d9a05b] shadow-md">
                <h3 className="text-lg font-bold mb-1 text-[#7a4b1b] uppercase">Regras da Casa</h3>
                <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">Configuráveis no Menu Inicial</p>
                
                <div className="mb-4">
                  <h4 className="font-bold text-[#5c3716]">Comer Para Trás:</h4>
                  <p className="text-sm font-medium mt-1 text-slate-700">Peças normais não podem iniciar um turno comendo para trás. Exceção: Durante um combo, após o primeiro pulo pra frente, capturar pra trás está liberado!</p>
                </div>

                <div>
                  <h4 className="font-bold text-[#5c3716]">Dama Voadora:</h4>
                  <p className="text-sm font-medium mt-1 text-slate-700">A Dama perde o privilégio de deslizar após capturar. Ela deve pousar compulsoriamente na primeira casa vazia após a peça inimiga.</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'xadrez') {
    return (
      <div className="min-h-screen bg-[#9ce5e5] text-[#3a2218] p-4 md:p-8 relative flex justify-center font-sans">
        <div className="fixed inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c4f2f2] to-[#60b9b9] pointer-events-none" />
        
        <div className="w-full max-w-6xl z-10 bg-[#fdf8ef] rounded-xl shadow-2xl border-4 border-[#3a2218] flex flex-col p-6 md:p-10 h-fit my-auto relative mt-8 md:mt-auto">
          
          <Link 
            href={`/?open=${id}`} 
            className="absolute -top-6 -right-6 bg-[#c49a6c] text-[#3a2218] w-14 h-14 flex items-center justify-center rounded-full font-black shadow-xl hover:bg-[#a67c4d] hover:scale-110 active:scale-95 transition-all border-4 border-[#3a2218] text-2xl"
            title="Fechar Manual"
          >
            X
          </Link>



          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Coluna Esquerda: Objetivo e Peças */}
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-[#3a2218] uppercase tracking-wide mb-2 flex items-center gap-3 border-b-2 border-[#c49a6c] pb-2">
                <span className="bg-[#3a2218] text-[#fdf8ef] w-8 h-8 flex items-center justify-center rounded-full text-lg shrink-0">1</span> 
                Como Jogar
              </h2>

              <section className="bg-white p-5 rounded-lg border-2 border-[#c49a6c] shadow-sm">
                <h3 className="text-lg font-bold mb-2 text-[#3a2218]">Objetivo</h3>
                <p className="text-base font-medium mb-2 text-slate-700">
                  O objetivo do xadrez é dar <strong>Xeque-Mate</strong> no Rei adversário — colocá-lo em uma posição de ataque da qual não é possível escapar.
                </p>
                <p className="text-base font-medium text-slate-700">
                  Cada jogador começa com <strong>16 peças</strong>: 1 Rei, 1 Dama, 2 Torres, 2 Bispos, 2 Cavalos e 8 Peões. As Brancas sempre jogam primeiro.
                </p>
              </section>

              <section className="bg-white p-5 rounded-lg border-2 border-[#c49a6c] shadow-sm">
                <h3 className="text-lg font-bold mb-3 text-[#3a2218]">Movimento das Peças</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-[#f0d9b5]/40 rounded-md border border-[#c49a6c]/40">
                    <span className="text-4xl leading-none">♙</span>
                    <div>
                      <h4 className="font-black text-[#3a2218]">Peão</h4>
                      <p className="text-sm text-slate-700 font-medium">Anda 1 casa para frente. No primeiro lance, pode andar 2 casas. Captura na diagonal (1 casa).</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#f0d9b5]/40 rounded-md border border-[#c49a6c]/40">
                    <span className="text-4xl leading-none">♖</span>
                    <div>
                      <h4 className="font-black text-[#3a2218]">Torre</h4>
                      <p className="text-sm text-slate-700 font-medium">Anda em linha reta: horizontal ou vertical, quantas casas quiser.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#f0d9b5]/40 rounded-md border border-[#c49a6c]/40">
                    <span className="text-4xl leading-none">♘</span>
                    <div>
                      <h4 className="font-black text-[#3a2218]">Cavalo</h4>
                      <p className="text-sm text-slate-700 font-medium">Movimenta-se em "L": 2 casas em uma direção + 1 casa perpendicular. É a única peça que <strong>pula</strong> outras.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#f0d9b5]/40 rounded-md border border-[#c49a6c]/40">
                    <span className="text-4xl leading-none">♗</span>
                    <div>
                      <h4 className="font-black text-[#3a2218]">Bispo</h4>
                      <p className="text-sm text-slate-700 font-medium">Anda apenas na diagonal, quantas casas quiser. Cada Bispo permanece sempre na cor de casa que começou.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#f0d9b5]/40 rounded-md border border-[#c49a6c]/40">
                    <span className="text-4xl leading-none">♕</span>
                    <div>
                      <h4 className="font-black text-[#3a2218]">Dama (Rainha)</h4>
                      <p className="text-sm text-slate-700 font-medium">A peça mais poderosa. Combina os movimentos da Torre e do Bispo: retas e diagonais, sem limite de casas.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#f0d9b5]/40 rounded-md border border-[#c49a6c]/40">
                    <span className="text-4xl leading-none">♔</span>
                    <div>
                      <h4 className="font-black text-[#3a2218]">Rei</h4>
                      <p className="text-sm text-slate-700 font-medium">Anda apenas 1 casa por vez em qualquer direção. Nunca pode se mover para uma casa atacada.</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Coluna Direita: Regras Especiais e Fim de Jogo */}
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-[#3a2218] uppercase tracking-wide mb-2 flex items-center gap-3 border-b-2 border-[#c49a6c] pb-2">
                <span className="bg-[#3a2218] text-[#fdf8ef] w-8 h-8 flex items-center justify-center rounded-full text-lg shrink-0">2</span> 
                Movimentos Especiais
              </h2>

              <section className="bg-[#f0d9b5]/40 p-5 rounded-lg border-2 border-[#c49a6c] shadow-md">
                <h3 className="text-lg font-bold mb-2 text-[#3a2218] flex items-center gap-2">
                  <span className="text-2xl">♔ ♖</span> Roque
                </h3>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Único momento em que duas peças se movem no mesmo turno. O Rei anda 2 casas em direção a uma Torre, e a Torre "pula" para o outro lado do Rei.
                </p>
                <p className="text-xs font-bold text-[#3a2218]/70 uppercase mt-2">Condições:</p>
                <ul className="list-disc list-outside ml-5 mt-1 space-y-1 text-sm font-medium text-slate-700">
                  <li>Rei e Torre nunca podem ter se movido antes.</li>
                  <li>Não pode haver peças entre eles.</li>
                  <li>O Rei não pode estar em xeque, nem passar por casa atacada.</li>
                </ul>
              </section>

              <section className="bg-[#f0d9b5]/40 p-5 rounded-lg border-2 border-[#c49a6c] shadow-md">
                <h3 className="text-lg font-bold mb-2 text-[#3a2218] flex items-center gap-2">
                  <span className="text-2xl">♙</span> En Passant
                </h3>
                <p className="text-sm font-medium text-slate-700">
                  Se um Peão adversário avança 2 casas de uma só vez e para ao lado do seu Peão, você pode capturá-lo <strong>"de passagem"</strong> como se ele tivesse andado apenas 1 casa.
                </p>
                <p className="text-xs italic text-slate-600 mt-2">⚠ Precisa ser feito imediatamente no lance seguinte, ou o direito é perdido.</p>
              </section>

              <section className="bg-[#f0d9b5]/40 p-5 rounded-lg border-2 border-[#c49a6c] shadow-md">
                <h3 className="text-lg font-bold mb-2 text-[#3a2218] flex items-center gap-2">
                  <span className="text-2xl">♙ → ♕</span> Promoção
                </h3>
                <p className="text-sm font-medium text-slate-700">
                  Quando um Peão alcança a última fileira do tabuleiro, ele deve ser <strong>promovido</strong> a Dama, Torre, Bispo ou Cavalo (à sua escolha).
                </p>
                <p className="text-xs italic text-slate-600 mt-2">💡 Na maioria dos casos, escolhe-se a Dama por ser a peça mais poderosa.</p>
              </section>

              <h2 className="text-2xl font-bold text-[#3a2218] uppercase tracking-wide mb-2 mt-4 flex items-center gap-3 border-b-2 border-[#c49a6c] pb-2">
                <span className="bg-[#3a2218] text-[#fdf8ef] w-8 h-8 flex items-center justify-center rounded-full text-lg shrink-0">3</span> 
                Fim de Jogo
              </h2>

              <section className="bg-[#e11d48]/10 p-5 rounded-lg border-2 border-[#e11d48]/50 shadow-md">
                <h3 className="text-lg font-bold mb-2 text-[#7a1029]">Vitória: Xeque-Mate</h3>
                <p className="text-sm font-medium text-slate-700">
                  Ocorre quando o Rei adversário está em <strong>xeque</strong> (sob ataque) e não existe nenhum lance legal para escapar. Fim de jogo!
                </p>
              </section>

              <section className="bg-[#3a2218]/5 p-5 rounded-lg border-2 border-[#3a2218]/30 shadow-md">
                <h3 className="text-lg font-bold mb-2 text-[#3a2218]">Empate</h3>
                <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">O jogo pode terminar em empate por:</p>
                <ul className="list-disc list-outside ml-5 space-y-2 text-sm font-medium text-slate-700">
                  <li><strong>Afogamento (Stalemate):</strong> O jogador da vez não tem lances legais, mas o Rei não está em xeque.</li>
                  <li><strong>Repetição Tripla:</strong> A mesma posição se repete 3 vezes durante a partida.</li>
                  <li><strong>Regra dos 50 Lances:</strong> 50 lances consecutivos sem captura ou movimento de peão.</li>
                  <li><strong>Material Insuficiente:</strong> Nenhum dos lados tem peças suficientes para dar mate (ex: Rei contra Rei).</li>
                </ul>
              </section>
            </div>
          </div>

          {/* Dica Final */}
          <div className="mt-8 p-4 bg-[#3a2218] text-[#fdf8ef] rounded-lg text-center border-4 border-[#c49a6c]">
            <p className="font-black uppercase tracking-widest text-sm">💡 Dica de Ouro</p>
            <p className="text-xs md:text-sm mt-2 font-medium text-[#fdf8ef]/90">
              Controle o centro do tabuleiro, desenvolva suas peças menores (Cavalos e Bispos) primeiro e proteja seu Rei com o Roque o quanto antes!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf8ef] flex items-center justify-center">
      <h1 className="text-3xl font-bold text-[#3a2218]">Manual não encontrado!</h1>
      <Link href="/" className="ml-4 underline text-[#4a8b54]">Voltar à Estante</Link>
    </div>
  );
}

``


### Arquivo: .\src\app\layout.tsx
``typescript
import type { Metadata } from "next";
import { Luckiest_Guy, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const vintageFont = Luckiest_Guy({
  variable: "--font-vintage",
  weight: "400",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

import VintageOverlay from "@/components/VintageOverlay";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

``


### Arquivo: .\src\app\page.tsx
``typescript
import AtticScene from '@/components/AtticScene';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#2a1a0e]">
      <AtticScene />
    </main>
  );
}

``


### Arquivo: .\src\components\AtticScene.tsx
``typescript
'use client';
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Shelf from './Shelf';
import GameTable from './GameTable';

interface Game {
  id: string;
  title: string;
  cover: string;
  description: string;
  themeScene: string;
  boxColor?: string;
}

export default function AtticScene() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#2a1a0e]">
      <AnimatePresence mode="wait">
        {!selectedGame ? (
          <Shelf
            key="shelf"
            onSelectGame={(game) => setSelectedGame(game)}
          />
        ) : (
          <GameTable
            key="table"
            game={selectedGame}
            onClose={() => setSelectedGame(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

``


### Arquivo: .\src\components\CheckersBoard.tsx
``typescript
'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  newGame,
  step,
} from '@/lib/engine/checkers';
import type { GameState, Move, Pos } from '@/types/checkers';
import Piece from '@/components/Piece';
import confetti from 'canvas-confetti';
import { RotateCcw, ArrowLeft, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askAI, resetCheckersAI } from '@/lib/ai/askAI';
import type { Difficulty } from '@/lib/ai/checkersAI';

type PieceIdMap = Record<number, string>;
type LastMove = { from: Pos; to: Pos };

function posKey(p: Pos): number {
  return p[0] * 8 + p[1];
}

function buildInitialIdMap(board: GameState['board']): PieceIdMap {
  const map: PieceIdMap = {};
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] !== 0) {
        map[posKey([r, c])] = `p-${r}-${c}-init`;
      }
    }
  }
  return map;
}

/** Atualiza o mapa de identidades para permitir animação contínua entre casas. */
function moveIdMap(idMap: PieceIdMap, move: Move): PieceIdMap {
  const next = { ...idMap };
  const fromKey = posKey(move.from);
  const toKey = posKey(move.to);
  const id = next[fromKey] ?? `p-fallback-${fromKey}`;
  delete next[fromKey];
  if (move.capture) {
    delete next[posKey(move.capture)];
  }
  next[toKey] = id;
  return next;
}

export default function CheckersBoard() {
  const searchParams = useSearchParams();

  const mode = searchParams.get('mode') === 'ai' ? 'ai' : 'offline';
  const difficulty = (searchParams.get('difficulty') || 'medio') as Difficulty;

  const [state, setState] = useState<GameState>(() => newGame());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [idMap, setIdMap] = useState<PieceIdMap>(() => buildInitialIdMap(newGame().board));
  const [isAnimating, setIsAnimating] = useState(false);
  const busyRef = React.useRef(false);

  useEffect(() => {
    const regras: any = {
      canCaptureBackwards: searchParams.get('backwards') !== 'false',
      kingStopsImmediately: searchParams.get('kingStops') === 'true',
    };
    const fresh = newGame(regras);
    setState(fresh);
    setSelected(null);
    setLastMove(null);
    setIdMap(buildInitialIdMap(fresh.board));
    resetCheckersAI();
  }, [searchParams]);

  const score = {
    green: 12 - state.board.flat().filter(c => c === -1 || c === -2).length,
    red: 12 - state.board.flat().filter(c => c === 1 || c === 2).length,
  };

  useEffect(() => {
    if (state.winner) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: state.winner === 1 ? ['#10b981', '#059669', '#ffffff'] : ['#f43f5e', '#e11d48', '#ffffff']
      });
    }
  }, [state.winner]);

  /** Aplica um lance: atualiza tabuleiro, IDs das peças (p/ animação) e destaque. */
  const applyStep = (current: GameState, move: Move): GameState => {
    const next = step(current, move);
    setIdMap(prev => moveIdMap(prev, move));
    setLastMove({ from: move.from, to: move.to });
    return next;
  };

  // Lógica de turno da IA
  useEffect(() => {
    if (mode !== 'ai' || state.winner || state.turn !== -1 || isAnimating) return;
    if (busyRef.current) return;

    let active = true;

    const playAI = async () => {
      busyRef.current = true;
      setIsAnimating(true);

      try {
        const delay = difficulty === 'dificil' ? 500 : 1000;
        const [move] = await Promise.all([
          askAI(state.board, -1, difficulty, state.rules),
          new Promise(r => setTimeout(r, delay))
        ]);
        if (!active || !move) return;

        let newState = applyStep(state, move);
        setState(newState);

        // ✅ Como o step() agora escopa corretamente os lances durante um
        // combo, "turno ainda é -1" já significa "captura múltipla em
        // andamento" — sem precisar recalcular nada aqui.
        while (active && !newState.winner && newState.turn === -1) {
          await new Promise(r => setTimeout(r, 350));
          const nextMove = newState.legalMoves[0];
          if (!nextMove) break;
          newState = applyStep(newState, nextMove);
          setState(newState);
        }
      } catch (err) {
        console.error('AI Error:', err);
      } finally {
        setIsAnimating(false);
        busyRef.current = false;
      }
    };

    playAI();

    return () => { active = false; };
  }, [state.turn, mode, difficulty, state.winner]);

  const handleCellClick = (row: number, col: number) => {
    if (state.winner || isAnimating) return;
    if (mode === 'ai' && state.turn === -1) return;

    const cell = state.board[row][col];

    if (!selected) {
      const belongs = (cell > 0 && state.turn === 1) || (cell < 0 && state.turn === -1);
      if (!belongs) return;
      setSelected([row, col]);
      return;
    }

    const selectedMove = state.legalMoves.find(m => {
      if (m.from[0] !== selected[0] || m.from[1] !== selected[1]) return false;

      if (m.fullPaths && m.fullPaths.length) {
        return m.fullPaths.some(p => {
          const last = p[p.length - 1];
          return last[0] === row && last[1] === col;
        });
      }
      return m.to[0] === row && m.to[1] === col;
    });

    if (!selectedMove) {
      // ✅ Se estamos no meio de uma captura obrigatória (todos os lances
      // legais atuais pertencem à mesma peça e são capturas), o jogador
      // NÃO pode abandonar a sequência clicando em outra peça.
      const forcedContinuation =
        state.legalMoves.length > 0 &&
        state.legalMoves.every(
          m => m.capture && m.from[0] === selected[0] && m.from[1] === selected[1]
        );

      if (forcedContinuation) return;

      const belongs = (cell > 0 && state.turn === 1) || (cell < 0 && state.turn === -1);
      setSelected(belongs ? [row, col] : null);
      return;
    }

    setIsAnimating(true);
    const prevTurn = state.turn;
    const newState = applyStep(state, selectedMove);
    setState(newState);
    setSelected(newState.turn === prevTurn && !newState.winner ? selectedMove.to : null);
    setIsAnimating(false);
  };

  const renderCell = (row: number, col: number) => {
    const cell = state.board[row][col];
    const isDark = (row + col) % 2 === 1;
    const isSelected = selected !== null && selected[0] === row && selected[1] === col;
    const isDestination = selected && state.legalMoves.some(
      (m: Move) => m.from[0] === selected[0] && m.from[1] === selected[1] && m.to[0] === row && m.to[1] === col
    );
    const isLastMoveSq = lastMove !== null && (
      (lastMove.from[0] === row && lastMove.from[1] === col) ||
      (lastMove.to[0] === row && lastMove.to[1] === col)
    );
    const isJustPromoted = state.justPromotedPos && state.justPromotedPos[0] === row && state.justPromotedPos[1] === col;
    const pieceId = cell !== 0 ? idMap[posKey([row, col])] : undefined;

    return (
      <div
        key={`${row}-${col}`}
        className={`
          relative w-full h-full flex items-center justify-center cursor-pointer select-none
          ${isDark ? 'bg-[#4a2e1b]' : 'bg-[#e8dcc4]'}
          ${(isSelected || isJustPromoted) ? 'z-50' : 'z-10'}
        `}
        onClick={() => handleCellClick(row, col)}
      >
        {isLastMoveSq && (
          <div className="absolute inset-0 bg-yellow-300/30 pointer-events-none z-0" />
        )}
        <div className="absolute inset-0 transition-colors duration-200 hover:bg-white/5" />

        <AnimatePresence mode="popLayout">
          {cell !== 0 && pieceId && (
            <motion.div
              key={pieceId}
              layoutId={pieceId}
              layout
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 480, damping: 30 }}
              className="w-[80%] h-[80%] flex items-center justify-center z-20"
            >
              <Piece cell={cell} isSelected={isSelected} isJustPromoted={!!isJustPromoted} />
            </motion.div>
          )}
        </AnimatePresence>

        {isDestination && (
          <div className="absolute w-[20%] h-[20%] bg-white rounded-full opacity-70 shadow-sm pointer-events-none z-30" />
        )}
      </div>
    );
  };

  const restart = () => {
    const fresh = newGame(state.rules);
    setState(fresh);
    setSelected(null);
    setLastMove(null);
    setIdMap(buildInitialIdMap(fresh.board));
    busyRef.current = false;
    setIsAnimating(false);
    resetCheckersAI();
  };

  return (
    <div className="flex flex-col w-full h-full items-center justify-center bg-transparent p-4 lg:p-8 gap-4 md:gap-6 overflow-hidden">
      <div className="flex w-full max-w-[95vw] lg:max-w-[80vh] items-center z-20 shrink-0">
        <div className="flex-1 flex justify-start">
          <a href="/?open=damas" className="flex items-center gap-1 md:gap-2 text-[#3a2218] hover:text-black font-black uppercase tracking-widest text-[10px] md:text-sm transition drop-shadow-sm">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Sair</span>
          </a>
        </div>
        <div className="flex-shrink-0 flex flex-row items-center justify-center px-1 md:px-4 relative">
          <div className="flex items-stretch border-4 border-[#3a2218] rounded-full shadow-lg overflow-hidden h-9 md:h-12 bg-[#fdf8ef]">
            <div className={`flex items-center gap-2 md:gap-3 px-3 md:px-6 transition-colors duration-300 ${state.turn === 1 && !state.winner ? 'bg-emerald-200' : 'bg-transparent'}`}>
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-emerald-500 border-2 border-[#3a2218] shadow-sm" />
              <span className={`text-base md:text-xl font-black transition-colors ${state.turn === 1 && !state.winner ? 'text-emerald-950' : 'text-[#3a2218]'}`}>{score.green}</span>
            </div>
            <div className="flex items-center justify-center px-3 md:px-4 bg-[#fdf8ef] border-x-4 border-[#3a2218] z-10">
               {state.winner ? <span className="font-black text-[9px] md:text-xs text-[#3a2218] uppercase tracking-widest">FIM</span> : <Trophy size={16} className="text-[#c49a6c]" />}
            </div>
            <div className={`flex items-center gap-2 md:gap-3 px-3 md:px-6 transition-colors duration-300 ${state.turn === -1 && !state.winner ? 'bg-rose-200' : 'bg-transparent'}`}>
              <span className={`text-base md:text-xl font-black transition-colors ${state.turn === -1 && !state.winner ? 'text-rose-950' : 'text-[#3a2218]'}`}>{score.red}</span>
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-rose-500 border-2 border-[#3a2218] shadow-sm" />
            </div>
          </div>
          {mode === 'ai' && state.turn === -1 && !state.winner && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[#3a2218] font-bold text-[10px] uppercase tracking-wider animate-pulse whitespace-nowrap">
              IA pensando...
            </div>
          )}
        </div>
        <div className="flex-1 flex justify-end">
          <button onClick={restart} className="flex items-center gap-1 md:gap-2 bg-[#3a2218] text-[#fdf8ef] px-3 py-1.5 md:px-4 md:py-2 rounded-full font-black uppercase text-[9px] md:text-xs tracking-widest shadow-md hover:scale-105 transition-all hover:bg-black active:scale-95 border-2 border-transparent hover:border-[#c49a6c]">
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-8 grid-rows-8 shadow-2xl rounded-sm border-4 border-[#3a2218] w-full max-w-[95vw] lg:max-w-[80vh] aspect-square bg-[#3a2218] relative z-10 shrink-0">
        {Array.from({ length: 8 }).map((_, r) =>
          Array.from({ length: 8 }).map((_, c) => renderCell(r, c))
        )}
        {selected && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 drop-shadow-lg" viewBox="0 0 8 8">
            {state.legalMoves
              .filter(m => m.from[0] === selected[0] && m.from[1] === selected[1] && m.fullPaths && m.fullPaths.length > 0)
              .flatMap((m, i) =>
                m.fullPaths!.filter(path => path.length > 1).map((path, j) => {
                  const points = [selected, ...path].map(p => `${p[1] + 0.5},${p[0] + 0.5}`).join(' ');
                  const finalPos = path[path.length - 1];
                  return (
                    <g key={`combo-${i}-${j}`}>
                      <polyline points={points} fill="none" stroke="white" strokeWidth="0.12" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
                      {path.slice(0, -1).map((p, k) => (
                        <circle key={`mid-${k}`} cx={p[1] + 0.5} cy={p[0] + 0.5} r="0.1" fill="white" opacity="0.6" />
                      ))}
                      <circle cx={finalPos[1] + 0.5} cy={finalPos[0] + 0.5} r="0.15" fill="#fde047" opacity="0.9" />
                    </g>
                  );
                })
              )}
          </svg>
        )}
      </div>
      <AnimatePresence>
        {state.winner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-sm p-4">
            <motion.div initial={{ scale: 0.5, rotate: -5, y: 50 }} animate={{ scale: 1, rotate: 0, y: 0 }} transition={{ type: "spring", bounce: 0.5, duration: 0.7 }} className={`flex flex-col items-center p-8 md:p-12 bg-stone-200 border-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-center max-w-[90vw] ${state.winner === 1 ? 'border-emerald-600' : 'border-rose-600'}`}>
              <Trophy size={64} className="text-[#c49a6c] mb-2 drop-shadow-sm" />
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-widest drop-shadow-sm mb-2 text-[#3a2218]">VITÓRIA!</h2>
              <div className={`text-xl md:text-3xl font-black uppercase tracking-widest mb-8 ${state.winner === 1 ? 'text-emerald-600' : 'text-rose-600'}`}>O {state.winner === 1 ? 'VERDE' : 'VERMELHO'} VENCEU</div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <a href="/?open=damas" className={`flex items-center justify-center gap-2 bg-white px-6 py-3 rounded-full font-black uppercase text-sm md:text-base tracking-widest hover:scale-105 transition-all active:scale-95 border-4 ${state.winner === 1 ? 'text-emerald-600 border-emerald-600 hover:bg-emerald-50' : 'text-rose-600 border-rose-600 hover:bg-rose-50'}`}>
                  <ArrowLeft size={18} /> Sair
                </a>
                <button onClick={restart} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-black uppercase text-sm md:text-base tracking-widest shadow-xl hover:scale-105 transition-all active:scale-95 border-4 border-transparent text-white ${state.winner === 1 ? 'bg-emerald-600 hover:bg-emerald-700 hover:border-emerald-400' : 'bg-rose-600 hover:bg-rose-700 hover:border-rose-400'}`}>
                  <RotateCcw size={18} /> Jogar Novamente
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

``


### Arquivo: .\src\components\ChessBoard.tsx
``typescript
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

        <AnimatePresence mode="popLayout">
          {piece && pieceId && (
            <motion.div
              key={pieceId}
              layoutId={pieceId}
              layout
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: isSelected && !isDragging ? 1.05 : 1,
                opacity: isSelected && isDragging ? 0.95 : 1,
              }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 550, damping: 35 }}
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
          <div className="absolute w-[28%] h-[28%] bg-[#1e3b22]/20 rounded-full pointer-events-none z-10 shadow-sm" />
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#9ce5e5] gap-4 p-4 lg:p-8 font-sans">
      <div className="fixed inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c4f2f2] to-[#60b9b9] pointer-events-none" />

      <div className="flex w-full max-w-[95vw] lg:max-w-[95vh] items-center justify-between z-10 mb-2">
        <a
          href="/?open=xadrez"
          className="flex items-center gap-1 text-[#3a2218] hover:text-black font-black uppercase tracking-wider text-sm"
        >
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Voltar</span>
        </a>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-emerald-800">{whiteScore}</span>
            <span className="text-4xl text-white drop-shadow-md">♔</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-4xl text-black drop-shadow-md">♚</span>
            <span className="text-xl font-black text-rose-800">{blackScore}</span>
          </div>
        </div>

        <button
          onClick={restart}
          className="flex items-center gap-1 bg-[#3a2218] text-[#fdf8ef] px-4 py-2 rounded-lg font-black uppercase text-sm tracking-wider shadow-lg border-2 border-black hover:bg-black hover:scale-105 active:scale-95 transition-all"
        >
          <RotateCcw size={16} />
          <span className="hidden sm:inline">Reiniciar</span>
        </button>
      </div>

      {/* Container central: Tabuleiro + Histórico lado a lado */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 w-full z-10">
        
        {/* Tabuleiro com coordenadas ao redor */}
        <div className="flex items-start">
          
          {/* Coluna de números (ranks) à esquerda */}
          <div className="flex flex-col justify-around pr-2 h-full aspect-[1/8] max-w-[90vw] lg:max-w-[70vh]" 
               style={{ height: 'min(70vh, 90vw)' }}>
            {[...RANKS].reverse().map((r) => (
              <div key={r} className="flex-1 flex items-center justify-center text-[#3a2218] font-black text-sm md:text-base">
                {r}
              </div>
            ))}
          </div>

          {/* Bloco tabuleiro + letras embaixo */}
          <div className="flex flex-col">
            <div
              ref={boardRef}
              className="grid grid-cols-8 grid-rows-8 w-full max-w-[85vw] lg:max-w-[70vh] aspect-square border-8 border-[#3a2218] bg-[#3a2218] shadow-2xl relative shrink-0"
              style={{ touchAction: 'none', height: 'min(70vh, 85vw)', width: 'min(70vh, 85vw)' }}
            >
              {Array.from({ length: 64 }).map((_, i) => {
                const r = 7 - Math.floor(i / 8);
                const f = i % 8;
                const sq = r * 8 + f;
                return renderSquare(sq);
              })}

              <AnimatePresence>
                {pendingPromotion && (
                  <PromotionPicker color={state.turn} onSelect={handlePromotionSelect} />
                )}
              </AnimatePresence>
            </div>

            {/* Linha de letras (files) embaixo */}
            <div className="flex justify-around pt-2 w-full">
              {FILES.map((f) => (
                <div key={f} className="flex-1 flex items-center justify-center text-[#3a2218] font-black text-sm md:text-base uppercase">
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Painel lateral de histórico */}
        <MoveHistory moves={moveHistory} result={result} />
      </div>

      <AnimatePresence>
        {result !== '*' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
          >
            <motion.div
              className={`p-8 bg-[#fdf8ef] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-center w-full max-w-sm border-8 ${
                result === '1-0' ? 'border-white' : result === '0-1' ? 'border-black' : 'border-gray-500'
              }`}
            >
              <Trophy size={80} className="mx-auto mb-6 text-[#c49a6c]" />
              <h2 className="text-3xl font-black uppercase tracking-widest text-[#3a2218] mb-2">
                {result === '1-0'
                  ? 'Vitória Branca'
                  : result === '0-1'
                  ? 'Vitória Preta'
                  : 'Empate'}
              </h2>
              <p className="text-lg font-medium text-[#3a2218]/70 mb-8">
                {result === '1/2-1/2' ? 'O jogo terminou sem um vencedor.' : 'Cheque-mate!'}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={restart}
                  className="w-full flex items-center justify-center py-4 bg-black text-white rounded-xl font-black uppercase text-lg shadow-lg border-4 border-white hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all"
                >
                  <RotateCcw size={20} className="mr-2" /> Revanche
                </button>
                <a
                  href="/?open=xadrez"
                  className="w-full flex items-center justify-center py-4 bg-white text-black rounded-xl font-black uppercase text-lg shadow-lg border-4 border-black hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all block"
                >
                  Sair
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-8 flex items-center justify-center w-full z-10 mt-4 gap-3">
        {inCheck && result === '*' && (
          <div className="px-4 py-1.5 bg-rose-600 text-white rounded-full text-sm font-black tracking-widest shadow-md border-2 border-black/50 animate-pulse">
            XEQUE!
          </div>
        )}

        {mode === 'ai' && state.turn === 'b' && result === '*' && (
          <div className="px-4 py-1.5 bg-[#3a2218]/80 text-[#fdf8ef] rounded-full text-sm font-bold tracking-widest animate-pulse border-2 border-black/50 shadow-md">
            MÁQUINA PENSANDO...
          </div>
        )}
      </div>
    </div>
  );
}

``


### Arquivo: .\src\components\DustParticles.tsx
``typescript
'use client';
import React from 'react';
import { motion } from 'framer-motion';

export default function DustParticles() {
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber-200/60"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, -15, -45, 0],
            x: [0, 15, -10, 20, 0],
            opacity: [0, 0.8, 0.4, 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

``


### Arquivo: .\src\components\GameBox.tsx
``typescript
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










``


### Arquivo: .\src\components\GameTable.tsx
``typescript
'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  cover: string;
  description: string;
  themeScene: string;
  boxColor?: string;
}

interface Props {
  game: Game;
  onClose: () => void;
}

export default function GameTable({ game, onClose }: Props) {
  const [boxOpen, setBoxOpen] = useState(false);
  const [step, setStep] = useState<'MODE' | 'OFFLINE_SELECT' | 'ONLINE_SELECT' | 'OFFLINE_RULES' | 'MACHINE_RULES'>('MODE');
  const [canCaptureBackwards, setCanCaptureBackwards] = useState(true);
  const [kingStopsImmediately, setKingStopsImmediately] = useState(false);
  const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');

  const closeBox = () => {
    setBoxOpen(false);
    setStep('MODE');
    setTimeout(() => onClose(), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(6px)' }}
      transition={{ duration: 0.6 }}
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #3d2517 0%, #2a1a0e 50%, #1f130a 100%)',
      }}
    >
      {/* === PAREDE DE FUNDO (igual o sótão) === */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(196,154,108,0.3) 40px, rgba(196,154,108,0.3) 41px),
          repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(196,154,108,0.3) 40px, rgba(196,154,108,0.3) 41px)`,
        }}
      />

      {/* === LÂMPADA === */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
        <div className="w-0.5 h-8 bg-[#1a1a1a]" />
        <div className="relative">
          <div className="w-4 h-4 bg-[#2a2a2a] rounded-full" />
          <div className="w-8 h-5 bg-gradient-to-b from-[#3a3a2a] to-[#2a2a1a] rounded-b-full mx-auto -mt-1" />
          <div className="w-3 h-3 bg-amber-300 rounded-full mx-auto -mt-2 shadow-[0_0_40px_15px_rgba(251,191,36,0.3)]" />
        </div>
      </div>

      {/* === LUZ === */}
      <div
        className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none z-10"
        style={{
          width: '70vw',
          height: '80vh',
          background: 'radial-gradient(ellipse at top, rgba(251,191,36,0.1) 0%, transparent 60%)',
        }}
      />

      {/* === VINHETA === */}
      <div className="absolute inset-0 pointer-events-none z-30 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(10,5,2,0.75)_100%)]" />

      {/* === BOTÃO VOLTAR === */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        onClick={closeBox}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-[#c49a6c] hover:text-[#fdf8ef] font-black uppercase tracking-widest text-sm transition-colors"
      >
        <ArrowLeft size={20} />
        Guardar
      </motion.button>

      {/* === MESA DE MADEIRA === */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, type: 'spring', stiffness: 100 }}
        className="relative z-40 w-[90vw] max-w-4xl"
      >
        {/* Superfície da mesa */}
        <div className="relative bg-gradient-to-b from-[#6b4423] to-[#4a2e1b] rounded-xl border-4 border-[#3a2218] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(139,98,52,0.4)] p-8 md:p-12 min-h-[400px]">
          
          {/* Textura de madeira */}
          <div className="absolute inset-0 rounded-xl opacity-20 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 30px,
                rgba(0,0,0,0.08) 30px,
                rgba(0,0,0,0.08) 31px
              )`,
            }}
          />

          {/* Reflexo de luz */}
          <div className="absolute top-0 inset-x-0 h-1/3 rounded-t-xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <AnimatePresence mode="wait">
            {!boxOpen ? (
              /* === CAIXA FECHADA NA MESA === */
              <motion.div
                key="closed"
                initial={{ scale: 0.5, opacity: 0, rotateZ: -5 }}
                animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -30 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="flex flex-col items-center justify-center py-8 cursor-pointer group"
                onClick={() => setBoxOpen(true)}
              >
                <motion.div
                  whileHover={{ y: -8, scale: 1.02, rotateZ: 1 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative"
                  style={{
                    width: game.id === 'xadrez' ? '220px' : '200px',
                    height: game.id === 'xadrez' ? '300px' : '280px',
                  }}
                >
                  {/* Caixa com capa */}
                  <div className="absolute inset-0 rounded-lg overflow-hidden border-4 border-[#1a0e06] shadow-[0_15px_40px_rgba(0,0,0,0.7)] bg-[#3a2218]">
                    {game.cover ? (
                      <img src={game.cover} alt={game.title} className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300" />
                    ) : (
                      <div className="w-full h-full bg-[#c49a6c] flex items-center justify-center text-6xl">📦</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />
                    <div className="absolute top-0 inset-x-0 h-1/4 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                  </div>

                  {/* Lateral */}
                  <div className="absolute top-0 -right-4 w-4 h-full rounded-r-md border-r-2 border-t border-b border-[#1a0e06]/60"
                    style={{ background: `linear-gradient(180deg, ${game.boxColor || '#5c3716'}, ${game.boxColor || '#3a2218'})` }}
                  />
                  {/* Base */}
                  <div className="absolute -bottom-3 inset-x-0 h-3 rounded-b-md border-b-2 border-x border-[#1a0e06]/60"
                    style={{ background: `linear-gradient(90deg, ${game.boxColor || '#3a2218'}, ${game.boxColor || '#2a1508'})` }}
                  />

                  {/* Sombra */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[85%] h-6 bg-black/40 blur-lg rounded-full" />
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 text-[#c49a6c]/60 text-sm font-bold tracking-widest uppercase animate-pulse"
                >
                  Clique para abrir
                </motion.p>
              </motion.div>
            ) : (
              /* === CAIXA ABERTA — CONTEÚDO === */
              <motion.div
                key="open"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col lg:flex-row gap-8 items-center lg:items-start relative z-10"
              >
                {/* MANUAL (Lado Esquerdo) */}
                <motion.a
                  href={`/manual/${game.id}`}
                  initial={{ x: -40, opacity: 0, rotateZ: -3 }}
                  animate={{ x: 0, opacity: 1, rotateZ: -2 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  whileHover={{ scale: 1.05, rotateZ: 0 }}
                  className="block w-full max-w-[200px] lg:max-w-[240px] shrink-0"
                  title="Ler Manual"
                >
                  <div className="bg-[#fdf8ef] rounded-lg border-4 border-[#3a2218] shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
                    <img
                      src={game.id === 'xadrez' ? '/manual-xadrez.jpg' : '/manual-cover.jpg'}
                      alt="Manual"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <p className="text-center text-[#c49a6c]/70 text-xs font-bold uppercase tracking-widest mt-2">
                    📖 Manual
                  </p>
                </motion.a>

                {/* OPÇÕES (Lado Direito) */}
                <motion.div
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex-1 w-full"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col gap-4"
                    >
                      {step === 'MODE' && (
                        <>
                          <h2 className="text-3xl font-black uppercase tracking-widest text-[#fdf8ef] text-center mb-4 drop-shadow-md">
                            {game.title}
                          </h2>
                          <button onClick={() => setStep('OFFLINE_SELECT')}
                            className="bg-[#c49a6c] hover:bg-[#a67c4d] text-[#3a2218] py-4 rounded-lg font-black text-lg uppercase tracking-widest shadow-xl border-4 border-[#3a2218] hover:-translate-y-1 transition-all">
                            Offline
                          </button>
                          <button onClick={() => setStep('ONLINE_SELECT')}
                            className="bg-[#c49a6c] hover:bg-[#a67c4d] text-[#3a2218] py-4 rounded-lg font-black text-lg uppercase tracking-widest shadow-xl border-4 border-[#3a2218] hover:-translate-y-1 transition-all">
                            Online
                          </button>
                        </>
                      )}

                      {step === 'OFFLINE_SELECT' && (
                        <>
                          <button onClick={() => game.id === 'xadrez' ? window.location.href = '/game/xadrez?mode=offline' : setStep('OFFLINE_RULES')}
                            className="bg-[#c49a6c] hover:bg-[#a67c4d] text-[#3a2218] py-4 rounded-lg font-black text-lg uppercase tracking-widest shadow-xl border-4 border-[#3a2218] hover:-translate-y-1 transition-all">
                            Joga e Passa
                          </button>
                          <button onClick={() => game.id === 'xadrez' ? window.location.href = `/game/xadrez?mode=ai&difficulty=${difficulty}` : setStep('MACHINE_RULES')}
                            className="bg-[#c49a6c] hover:bg-[#a67c4d] text-[#3a2218] py-4 rounded-lg font-black text-lg uppercase tracking-widest shadow-xl border-4 border-[#3a2218] hover:-translate-y-1 transition-all">
                            Contra a Máquina
                          </button>
                          <button onClick={() => setStep('MODE')} className="text-[#c49a6c] underline font-bold mt-2 self-center hover:text-[#fdf8ef]">
                            Voltar
                          </button>
                        </>
                      )}

                      {step === 'OFFLINE_RULES' && game.id === 'damas' && (
                        <div className="flex flex-col gap-4 bg-[#fdf8ef] p-4 rounded-lg border-4 border-[#3a2218]">
                          <h3 className="text-[#3a2218] font-black uppercase tracking-widest text-lg text-center mb-2">Joga e Passa</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-[#3a2218] font-bold text-sm">Comer para trás:</span>
                            <button onClick={() => setCanCaptureBackwards(!canCaptureBackwards)}
                              className={`px-3 py-1 rounded font-black text-xs uppercase border-2 ${canCaptureBackwards ? 'bg-emerald-500 border-emerald-700 text-white' : 'bg-rose-500 border-rose-700 text-white'}`}>
                              {canCaptureBackwards ? 'LIGADO' : 'DESLIGADO'}
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#3a2218] font-bold text-sm leading-tight max-w-[60%]">Parada da Dama voadora após comer:</span>
                            <button onClick={() => setKingStopsImmediately(!kingStopsImmediately)}
                              className={`px-3 py-1 rounded font-black text-xs uppercase border-2 text-white ${kingStopsImmediately ? 'bg-[#3a2218] border-black' : 'bg-[#c49a6c] border-[#3a2218]'}`}>
                              {kingStopsImmediately ? '1ª CASA' : 'QUALQUER'}
                            </button>
                          </div>
                          <a href={`/game/${game.id}?mode=offline&backwards=${canCaptureBackwards}&kingStops=${kingStopsImmediately}`}
                            className="mt-4 bg-[#4a8b54] text-center text-[#fdf8ef] py-3 rounded-lg font-black text-lg uppercase tracking-widest shadow-xl border-4 border-[#1e3b22] hover:bg-[#3a6e42] hover:scale-105 active:scale-95 transition-all">
                            Vamos Começar!
                          </a>
                          <button onClick={() => setStep('OFFLINE_SELECT')} className="text-[#3a2218] underline font-bold mt-1 self-center hover:text-black">Voltar</button>
                        </div>
                      )}

                      {step === 'MACHINE_RULES' && (
                        <div className="flex flex-col gap-4 bg-[#fdf8ef] p-4 rounded-lg border-4 border-[#3a2218]">
                          <h3 className="text-[#3a2218] font-black uppercase tracking-widest text-lg text-center mb-2">Contra a Máquina</h3>
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
                                <button onClick={() => setCanCaptureBackwards(!canCaptureBackwards)}
                                  className={`px-3 py-1 rounded font-black text-xs uppercase border-2 ${canCaptureBackwards ? 'bg-emerald-500 border-emerald-700 text-white' : 'bg-rose-500 border-rose-700 text-white'}`}>
                                  {canCaptureBackwards ? 'LIGADO' : 'DESLIGADO'}
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[#3a2218] font-bold text-sm leading-tight max-w-[60%]">Parada da Dama voadora após comer:</span>
                                <button onClick={() => setKingStopsImmediately(!kingStopsImmediately)}
                                  className={`px-3 py-1 rounded font-black text-xs uppercase border-2 text-white ${kingStopsImmediately ? 'bg-[#3a2218] border-black' : 'bg-[#c49a6c] border-[#3a2218]'}`}>
                                  {kingStopsImmediately ? '1ª CASA' : 'QUALQUER'}
                                </button>
                              </div>
                            </>
                          )}
                          <a href={`/game/${game.id}?mode=ai&difficulty=${difficulty}&backwards=${canCaptureBackwards}&kingStops=${kingStopsImmediately}`}
                            className="mt-4 bg-[#4a8b54] text-center text-[#fdf8ef] py-3 rounded-lg font-black text-lg uppercase tracking-widest shadow-xl border-4 border-[#1e3b22] hover:bg-[#3a6e42] hover:scale-105 active:scale-95 transition-all">
                            Vamos Começar!
                          </a>
                          <button onClick={() => setStep('OFFLINE_SELECT')} className="text-[#3a2218] underline font-bold mt-1 self-center hover:text-black">Voltar</button>
                        </div>
                      )}

                      {step === 'ONLINE_SELECT' && (
                        <>
                          <button className="bg-[#4a8b54] opacity-50 cursor-not-allowed text-[#fdf8ef] py-4 rounded-lg font-black text-lg uppercase tracking-widest shadow-xl border-4 border-[#1e3b22]">
                            Criar Sala
                          </button>
                          <button className="bg-[#4a8b54] opacity-50 cursor-not-allowed text-[#fdf8ef] py-4 rounded-lg font-black text-lg uppercase tracking-widest shadow-xl border-4 border-[#1e3b22]">
                            Entrar na Sala
                          </button>
                          <button onClick={() => setStep('MODE')} className="text-[#c49a6c] underline font-bold mt-2 self-center hover:text-[#fdf8ef]">Voltar</button>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Borda frontal da mesa */}
        <div className="absolute -bottom-3 inset-x-0 h-6 bg-gradient-to-b from-[#4a2e1b] to-[#2a1508] rounded-b-xl border-x-4 border-b-4 border-[#1a0e06]/60 shadow-[0_10px_30px_rgba(0,0,0,0.6)]" />

        {/* Pernas da mesa */}
        <div className="absolute -bottom-16 left-8 w-5 h-16 bg-gradient-to-b from-[#3a2218] to-[#2a1508] rounded-b-sm shadow-lg" />
        <div className="absolute -bottom-16 right-8 w-5 h-16 bg-gradient-to-b from-[#3a2218] to-[#2a1508] rounded-b-sm shadow-lg" />
      </motion.div>
    </motion.div>
  );
}

``


### Arquivo: .\src\components\MoveHistory.tsx
``typescript
'use client';
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Props {
  moves: string[]; // Lista de movimentos em SAN, na ordem: [w, b, w, b, ...]
  result: string;
}

export default function MoveHistory({ moves, result }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length]);

  // Agrupa em pares (turno das brancas + turno das pretas)
  const rounds: { number: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    rounds.push({
      number: i / 2 + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div 
      className="w-full lg:w-64 bg-[#fdf8ef] border-4 border-[#3a2218] rounded-xl shadow-2xl flex flex-col overflow-hidden"
      style={{ height: 'min(70vh, 90vw)' }}
    >
      <div className="bg-[#3a2218] text-[#fdf8ef] py-2 px-4 font-black uppercase tracking-widest text-sm text-center border-b-4 border-black shrink-0">
        Histórico
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-sm scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {rounds.length === 0 && (
          <div className="text-center text-[#3a2218]/50 py-6 italic font-sans text-xs">
            Nenhum lance ainda...
          </div>
        )}

        {rounds.map((r) => (
          <motion.div
            key={r.number}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-[2rem_1fr_1fr] gap-1 items-center py-1 px-2 hover:bg-[#c49a6c]/20 rounded odd:bg-[#e8dcc4]/40"
          >
            <span className="text-[#3a2218]/60 font-bold text-xs">{r.number}.</span>
            <span className="font-black text-[#3a2218]">{r.white}</span>
            <span className="font-black text-[#3a2218]/80">{r.black || ''}</span>
          </motion.div>
        ))}

        {result !== '*' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 py-2 text-center bg-[#3a2218] text-[#fdf8ef] rounded font-black uppercase text-sm tracking-widest"
          >
            {result}
          </motion.div>
        )}
      </div>
    </div>
  );
}

``


### Arquivo: .\src\components\Piece.tsx
``typescript
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

``


### Arquivo: .\src\components\Shelf.tsx
``typescript
'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DustParticles from './DustParticles';

interface Game {
  id: string;
  title: string;
  cover: string;
  description: string;
  themeScene: string;
  boxColor?: string;
}

interface Props {
  onSelectGame: (game: Game) => void;
}

export default function Shelf({ onSelectGame }: Props) {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    fetch('/games.json')
      .then((res) => res.json())
      .then((data) => setGames(data))
      .catch((err) => console.error('Failed to load games', err));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
      transition={{ duration: 0.6 }}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #3d2517 0%, #2a1a0e 40%, #1f130a 100%)',
      }}
    >
      {/* === PAREDE DE FUNDO (Papel de parede vintage) === */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 40px,
            rgba(196,154,108,0.3) 40px,
            rgba(196,154,108,0.3) 41px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 40px,
            rgba(196,154,108,0.3) 40px,
            rgba(196,154,108,0.3) 41px
          )`,
        }}
      />

      {/* === VIGAS DE MADEIRA NO TETO === */}
      <div className="absolute top-0 left-0 right-0 h-16 z-20">
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#2a1508] to-[#3d2517] border-b-4 border-[#1a0e06]" />
        {[15, 40, 65, 90].map((pos) => (
          <div
            key={pos}
            className="absolute top-0 h-16 w-6 bg-gradient-to-b from-[#3d2010] to-[#2a1508] border-x border-[#1a0e06]/50"
            style={{ left: `${pos}%` }}
          />
        ))}
      </div>

      {/* === LÂMPADA PENDURADA (centro) === */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
        <div className="w-0.5 h-12 bg-[#1a1a1a]" />
        <motion.div
          animate={{ rotateZ: [0, 1.5, -1.5, 0.5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
          style={{ transformOrigin: 'top center' }}
        >
          <div className="w-4 h-4 bg-[#2a2a2a] rounded-full" />
          <div className="w-8 h-5 bg-gradient-to-b from-[#3a3a2a] to-[#2a2a1a] rounded-b-full mx-auto -mt-1 border border-[#1a1a1a]/50" />
          <div className="w-3 h-3 bg-amber-300 rounded-full mx-auto -mt-2 shadow-[0_0_30px_10px_rgba(251,191,36,0.3),0_0_80px_30px_rgba(251,191,36,0.15)]" />
        </motion.div>
      </div>

      {/* === LUZ CENTRAL (cone de luz da lâmpada) === */}
      <div
        className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none z-10"
        style={{
          width: '60vw',
          height: '90vh',
          background: 'radial-gradient(ellipse at top, rgba(251,191,36,0.08) 0%, transparent 70%)',
        }}
      />

      {/* === VINHETA (cantos escuros) === */}
      <div className="absolute inset-0 pointer-events-none z-30 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,5,2,0.7)_100%)]" />

      {/* === PARTÍCULAS DE POEIRA === */}
      <DustParticles />

      {/* === QUADROS NAS PAREDES === */}
      {/* Quadro Esquerdo Alto */}
      <div className="absolute top-28 left-[5%] w-20 h-28 md:w-28 md:h-36 z-20 transform -rotate-3">
        <div className="w-full h-full bg-[#1a0e06] rounded-sm border-4 border-[#6b4423] shadow-lg p-1.5">
          <div className="w-full h-full bg-[#c49a6c]/20 rounded-sm flex items-center justify-center text-2xl md:text-4xl opacity-60">
            🎮
          </div>
        </div>
        {/* Fio do quadro */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-[#4a3218]" />
      </div>

      {/* Quadro Direito Alto */}
      <div className="absolute top-24 right-[6%] w-24 h-20 md:w-32 md:h-24 z-20 transform rotate-2">
        <div className="w-full h-full bg-[#1a0e06] rounded-sm border-4 border-[#6b4423] shadow-lg p-1.5">
          <div className="w-full h-full bg-[#c49a6c]/20 rounded-sm flex items-center justify-center text-2xl md:text-4xl opacity-60">
            🏆
          </div>
        </div>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-[#4a3218]" />
      </div>

      {/* Quadro Esquerdo Baixo */}
      <div className="absolute top-[55%] left-[3%] w-16 h-22 md:w-24 md:h-32 z-20 transform rotate-1 hidden lg:block">
        <div className="w-full h-full bg-[#1a0e06] rounded-sm border-4 border-[#6b4423] shadow-lg p-1.5">
          <div className="w-full h-full bg-[#c49a6c]/20 rounded-sm flex items-center justify-center text-2xl md:text-4xl opacity-60">
            🎲
          </div>
        </div>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-[#4a3218]" />
      </div>

      {/* Quadro Direito Baixo */}
      <div className="absolute top-[50%] right-[4%] w-20 h-16 md:w-28 md:h-20 z-20 transform -rotate-2 hidden lg:block">
        <div className="w-full h-full bg-[#1a0e06] rounded-sm border-4 border-[#6b4423] shadow-lg p-1.5">
          <div className="w-full h-full bg-[#c49a6c]/20 rounded-sm flex items-center justify-center text-2xl md:text-4xl opacity-60">
            🃏
          </div>
        </div>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-[#4a3218]" />
      </div>

      {/* === TÍTULO === */}
      <div className="relative z-40 flex flex-col items-center pt-24 md:pt-28 pb-6">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl md:text-7xl text-[#c49a6c] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-wider text-center"
          style={{ fontFamily: 'var(--font-vintage), cursive' }}
        >
          O Sótão
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.8 }}
          className="text-[#c49a6c] text-sm tracking-[0.3em] uppercase font-bold mt-2"
        >
          Escolha seu jogo
        </motion.p>
      </div>

      {/* === PRATELEIRAS === */}
      <div className="relative z-40 w-full max-w-5xl mx-auto flex flex-col gap-20 px-4 pb-20 mt-4">
        
        {/* Prateleira 1 — Com os jogos */}
        <div className="relative w-full flex justify-center items-end min-h-[280px]">
          {/* Tábua da prateleira */}
          <div className="absolute bottom-0 w-[90%] h-5 bg-gradient-to-b from-[#6b4423] to-[#4a2e1b] shadow-[0_8px_25px_-3px_rgba(0,0,0,0.9)] rounded-sm border-t-2 border-[#8b6234]" />
          <div className="absolute -bottom-2 w-[90%] h-3 bg-[#2a1508] rounded-b-sm shadow-xl" />
          
          {/* Suportes da prateleira */}
          <div className="absolute bottom-0 left-[7%] w-3 h-12 bg-gradient-to-r from-[#4a2e1b] to-[#3a2218] rounded-sm shadow-md" />
          <div className="absolute bottom-0 right-[7%] w-3 h-12 bg-gradient-to-r from-[#4a2e1b] to-[#3a2218] rounded-sm shadow-md" />
          
          {/* Caixas de Jogos */}
          <div className="relative z-20 flex gap-8 md:gap-12 px-8 pb-5 items-end">
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.2, type: 'spring', stiffness: 200 }}
                whileHover={{
                  y: -12,
                  rotateZ: 1,
                  scale: 1.03,
                  transition: { type: 'spring', stiffness: 400, damping: 15 },
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectGame(game)}
                className="relative cursor-pointer group"
                style={{ perspective: '800px' }}
              >
                {/* === CAIXA 3D === */}
                <div
                  className="relative"
                  style={{
                    transformStyle: 'preserve-3d',
                    width: game.id === 'xadrez' ? '180px' : '160px',
                    height: game.id === 'xadrez' ? '240px' : '220px',
                  }}
                >
                  {/* Face Frontal (Capa) */}
                  <div className="absolute inset-0 rounded-md overflow-hidden border-2 border-[#1a0e06] shadow-[4px_6px_20px_rgba(0,0,0,0.7)] bg-[#3a2218]">
                    {game.cover ? (
                      <img
                        src={game.cover}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#c49a6c] flex items-center justify-center">
                        <span className="text-5xl">📦</span>
                      </div>
                    )}

                    {/* Textura de papelão envelhecido */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none" />
                    <div className="absolute inset-0 mix-blend-multiply opacity-20 pointer-events-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                      }}
                    />

                    {/* Reflexo de luz no topo */}
                    <div className="absolute top-0 inset-x-0 h-1/4 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                  </div>

                  {/* Lateral Direita (Espessura da caixa) */}
                  <div
                    className="absolute top-0 -right-3 w-3 rounded-r-sm border-r border-t border-b border-[#1a0e06]/60"
                    style={{
                      height: '100%',
                      background: `linear-gradient(180deg, ${game.boxColor || '#5c3716'} 0%, ${game.boxColor || '#3a2218'} 100%)`,
                      transform: 'rotateY(0deg) skewY(-1deg)',
                    }}
                  />

                  {/* Base (Espessura inferior da caixa) */}
                  <div
                    className="absolute -bottom-2 inset-x-0 h-2 rounded-b-sm border-b border-x border-[#1a0e06]/60"
                    style={{
                      background: `linear-gradient(90deg, ${game.boxColor || '#3a2218'}, ${game.boxColor || '#2a1508'})`,
                      transform: 'skewX(-2deg)',
                    }}
                  />
                </div>

                {/* Sombra da caixa na prateleira */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/40 blur-md rounded-full group-hover:w-[90%] group-hover:bg-black/50 transition-all" />

                {/* Label flutuante no hover */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#fdf8ef] text-[#3a2218] px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest shadow-lg border-2 border-[#3a2218] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                >
                  {game.title}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Prateleira 2 — Vazia (para jogos futuros) */}
        <div className="relative w-full flex justify-center items-end min-h-[200px]">
          <div className="absolute bottom-0 w-[90%] h-5 bg-gradient-to-b from-[#6b4423] to-[#4a2e1b] shadow-[0_8px_25px_-3px_rgba(0,0,0,0.9)] rounded-sm border-t-2 border-[#8b6234]" />
          <div className="absolute -bottom-2 w-[90%] h-3 bg-[#2a1508] rounded-b-sm shadow-xl" />
          <div className="absolute bottom-0 left-[7%] w-3 h-12 bg-gradient-to-r from-[#4a2e1b] to-[#3a2218] rounded-sm shadow-md" />
          <div className="absolute bottom-0 right-[7%] w-3 h-12 bg-gradient-to-r from-[#4a2e1b] to-[#3a2218] rounded-sm shadow-md" />
          
          <div className="relative z-20 pb-6">
            <p className="text-[#6b4423]/40 text-sm font-bold tracking-widest uppercase italic">Em breve...</p>
          </div>
        </div>

        {/* Prateleira 3 — Vazia */}
        <div className="relative w-full flex justify-center items-end min-h-[200px]">
          <div className="absolute bottom-0 w-[90%] h-5 bg-gradient-to-b from-[#6b4423] to-[#4a2e1b] shadow-[0_8px_25px_-3px_rgba(0,0,0,0.9)] rounded-sm border-t-2 border-[#8b6234]" />
          <div className="absolute -bottom-2 w-[90%] h-3 bg-[#2a1508] rounded-b-sm shadow-xl" />
          <div className="absolute bottom-0 left-[7%] w-3 h-12 bg-gradient-to-r from-[#4a2e1b] to-[#3a2218] rounded-sm shadow-md" />
          <div className="absolute bottom-0 right-[7%] w-3 h-12 bg-gradient-to-r from-[#4a2e1b] to-[#3a2218] rounded-sm shadow-md" />
        </div>
      </div>

      {/* === CHÃO DE TÁBUAS === */}
      <div className="absolute bottom-0 left-0 right-0 h-16 z-20 bg-gradient-to-t from-[#1a0e06] to-[#2a1508] border-t-2 border-[#4a2e1b]/50" />
    </motion.div>
  );
}

``


### Arquivo: .\src\components\VintageOverlay.tsx
``typescript
export default function VintageOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden mix-blend-multiply">
      {/* Vinheta (Bordas escuras) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(58,34,24,0.4)_100%)]" />
      
      {/* Granulação de filme antigo (Noise) via SVG data URI inline */}
      <div 
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

    </div>
  );
}

``


### Arquivo: .\src\lib\ai\ai.worker.ts
``typescript
import { generateLegalMoves } from '@/lib/engine/checkers';
import { minimax } from './checkersAI';

self.addEventListener('message', (e) => {
  const { board, player, level, rules } = e.data;
  
  const legal = generateLegalMoves(board, player, rules);
  if (legal.length === 0) {
    self.postMessage({ move: null });
    return;
  }

  if (level === 'facil') {
    const idx = Math.floor(Math.random() * legal.length);
    self.postMessage({ move: legal[idx] });
    return;
  }

  const maxDepth = level === 'medio' ? 3 : 5;
  const startTime = performance.now();
  const budget = level === 'dificil' ? 650 : 0; 

  let bestMove = legal[0];
  let bestScore = -Infinity;

  for (let d = 1; d <= maxDepth; d++) {
    const { move, score } = minimax(board, player, d, -Infinity, Infinity, startTime, budget, rules, player);
    if (move === null) break; 
    bestMove = move;
    bestScore = score;
  }

  self.postMessage({ move: bestMove, score: bestScore });
});

``


### Arquivo: .\src\lib\ai\askAI.ts
``typescript
import type { Board, Move, GameRules } from '@/types/checkers';
import { minimax, resetTT } from './checkersAI';
import { generateLegalMoves } from '@/lib/engine/checkers';

export type Difficulty = 'facil' | 'medio' | 'dificil';

const SETTINGS: Record<Difficulty, { maxDepth: number; budget: number }> = {
  facil: { maxDepth: 3, budget: 250 },
  medio: { maxDepth: 6, budget: 600 },
  dificil: { maxDepth: 9, budget: 1200 },
};

let worker: Worker | null = null;
let workerFailed = false;

function initWorker() {
  if (worker || workerFailed) return;
  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url));
  } catch (err) {
    console.warn('Worker de damas falhou, usando thread principal', err);
    workerFailed = true;
  }
}

/** Limpa a Transposition Table — chame ao reiniciar a partida. */
export function resetCheckersAI() {
  resetTT();
  if (worker) worker.postMessage({ type: 'reset' });
}

export async function askAI(
  board: Board,
  player: 1 | -1,
  difficulty: Difficulty,
  rules: GameRules
): Promise<Move | null> {
  initWorker();

  const { maxDepth, budget } = SETTINGS[difficulty];

  if (!workerFailed && worker) {
    return new Promise<Move | null>((resolve, reject) => {
      const onMsg = (e: MessageEvent) => {
        clean();
        resolve(e.data.move ?? null);
      };
      const onErr = (e: ErrorEvent) => {
        clean();
        console.warn('Erro no worker de damas', e);
        workerFailed = true;
        fallback().then(resolve).catch(reject);
      };
      const clean = () => {
        worker?.removeEventListener('message', onMsg);
        worker?.removeEventListener('error', onErr);
      };
      worker?.addEventListener('message', onMsg);
      worker?.addEventListener('error', onErr);
      worker?.postMessage({ board, player, difficulty, maxDepth, budget, rules });
    });
  }

  return fallback();

  async function fallback(): Promise<Move | null> {
    const start = performance.now();
    const legal = generateLegalMoves(board, player, rules);
    if (!legal.length) return null;

    if (difficulty === 'facil') {
      const idx = Math.floor(Math.random() * legal.length);
      return legal[idx];
    }

    let bestMove: Move | null = legal[0];
    for (let d = 1; d <= maxDepth; d++) {
      const { move } = minimax(board, player, d, -1e9, 1e9, start, budget, rules, player);
      if (move) bestMove = move;
      if (performance.now() - start > budget) break;
    }
    return bestMove;
  }
}

``


### Arquivo: .\src\lib\ai\checkersAI.ts
``typescript
import { generateLegalMoves, applyMove } from '@/lib/engine/checkers';
import type { Board, Move, GameRules } from '@/types/checkers';

export type Difficulty = 'facil' | 'medio' | 'dificil';

// Piece-Square Table para peças normais — índice 0 = fileira de promoção,
// índice 7 = fileira inicial. Bordas (col 0 e col 7) recebem bônus por
// serem seguras contra captura (não dá pra saltar por fora do tabuleiro).
const MAN_PST = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [34, 32, 34, 34, 34, 34, 32, 34],
  [22, 20, 24, 24, 24, 24, 20, 22],
  [14, 12, 18, 20, 20, 18, 12, 14],
  [10,  8, 14, 16, 16, 14,  8, 10],
  [ 6,  4, 10, 10, 10, 10,  4,  6],
  [ 4,  2,  6,  6,  6,  6,  2,  4],
  [ 2,  0,  0,  0,  0,  0,  0,  2],
];

// Damas preferem o centro (mais mobilidade), evitam bordas.
const KING_PST = [
  [ 0,  5,  5,  5,  5,  5,  5,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [ 5, 10, 15, 15, 15, 15, 10,  5],
  [ 5, 10, 15, 20, 20, 15, 10,  5],
  [ 5, 10, 15, 20, 20, 15, 10,  5],
  [ 5, 10, 15, 15, 15, 15, 10,  5],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [ 0,  5,  5,  5,  5,  5,  5,  0],
];

function manPstValue(r: number, c: number, owner: 1 | -1): number {
  // Espelha a tabela conforme a direção de promoção de cada jogador.
  const row = owner === 1 ? r : 7 - r;
  return MAN_PST[row][c];
}

function kingPstValue(r: number, c: number): number {
  return KING_PST[r][c];
}

export function evaluateBoard(board: Board, player: 1 | -1, rules: GameRules): number {
  const PIECE = 100;
  const KING = 280;
  const VULN_PENALTY = 45;
  const MOBILITY_BONUS = 4;
  const CAPTURE_BONUS = 60;
  const PIECE_DIFF = 25;

  let score = 0;
  let myPieces = 0;
  let oppPieces = 0;

  const opponentMoves = generateLegalMoves(board, (player * -1) as 1 | -1, rules);
  const vulnerable = new Set<string>();
  opponentMoves.forEach(m => {
    if (m.capture) vulnerable.add(`${m.capture[0]},${m.capture[1]}`);
  });

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (!cell) continue;

      const owner = cell > 0 ? 1 : -1;
      const isKing = Math.abs(cell) === 2;
      const sign = owner === player ? 1 : -1;

      score += sign * (isKing ? KING : PIECE);
      score += sign * (isKing ? kingPstValue(r, c) : manPstValue(r, c, owner));

      if (vulnerable.has(`${r},${c}`)) score -= sign * VULN_PENALTY;

      if (sign === 1) myPieces++; else oppPieces++;
    }
  }

  const myMoves = generateLegalMoves(board, player, rules);
  const safeMoves = myMoves.filter(m => !m.capture);
  const oppSafe = opponentMoves.filter(m => !m.capture);

  score += safeMoves.length * MOBILITY_BONUS;
  score -= oppSafe.length * MOBILITY_BONUS;

  if (myMoves.some(m => m.capture)) score += CAPTURE_BONUS;
  score += (myPieces - oppPieces) * PIECE_DIFF;

  return score;
}

function evaluateWinnerFast(board: Board, turn: 1 | -1): 1 | -1 | null {
  const opponent = (turn * -1) as 1 | -1;
  const count = (p: 1 | -1) => board.flat().filter((c: any) => (p === 1 ? c > 0 : c < 0)).length;

  const myPieces = count(turn);
  const oppPieces = count(opponent);

  if (myPieces === 0) return opponent;
  if (oppPieces === 0) return turn;

  return null;
}

type MinimaxResult = { move: Move | null; score: number };

type TTEntry = { depth: number; score: number; flag: 'EXACT' | 'LOWER' | 'UPPER' };
const TT = new Map<string, TTEntry>();
const MAX_TT_ENTRIES = 150_000;

export function resetTT() {
  TT.clear();
}

// ✅ CORREÇÃO: o hash agora inclui de quem é a vez de jogar E a
// perspectiva original da busca. Antes, a mesma posição de tabuleiro
// com turnos diferentes (ou buscas de lados diferentes) podia
// compartilhar por engano o mesmo valor de cache.
function boardHash(board: Board, player: 1 | -1, originalPlayer: 1 | -1): string {
  return board.flat().join('') + '|' + player + '|' + originalPlayer;
}

export function minimax(
  board: Board,
  player: 1 | -1,
  depth: number,
  alpha: number,
  beta: number,
  startTime: number,
  timeBudget: number,
  rules: GameRules,
  originalPlayer: 1 | -1
): MinimaxResult {
  const hash = boardHash(board, player, originalPlayer);
  const entry = TT.get(hash);
  if (entry && entry.depth >= depth) {
    if (entry.flag === 'EXACT') return { move: null, score: entry.score };
    if (entry.flag === 'LOWER' && entry.score > alpha) alpha = entry.score;
    if (entry.flag === 'UPPER' && entry.score < beta) beta = entry.score;
    if (alpha >= beta) return { move: null, score: entry.score };
  }

  if (timeBudget > 0 && performance.now() - startTime > timeBudget) {
    return { move: null, score: 0 };
  }

  const legal = generateLegalMoves(board, player, rules);
  const winner = evaluateWinnerFast(board, player);
  const isTerminal = winner !== null || legal.length === 0;

  if (depth <= 0 || isTerminal) {
    let val: number;
    if (isTerminal) {
      // ✅ CORREÇÃO: agora a IA entende de fato quando alguém ganhou/perdeu
      // por falta de jogadas ou peças — antes só olhava material, então
      // não enxergava armadilhas nem evitava se encurralar.
      val = player === originalPlayer ? -(100000 + depth) : (100000 + depth);
    } else {
      val = evaluateBoard(board, originalPlayer, rules);
    }
    return { move: null, score: val };
  }

  let bestMove: Move | null = null;
  let bestScore = player === originalPlayer ? -Infinity : Infinity;

  const ordered = legal
    .map(m => ({
      m,
      score: m.capture ? 1000 : (m.promotion ? 500 : 0)
    }))
    .sort((a, b) => b.score - a.score)
    .map(o => o.m);

  for (const m of ordered) {
    const nextBoard = applyMove(board, m, player);

    let nextTurn = (player * -1) as 1 | -1;
    let nextDepth = depth - 1;

    if (m.capture) {
      const furtherCaptures = generateLegalMoves(nextBoard, player, rules, true, m.to);
      if (furtherCaptures.length > 0) {
        nextTurn = player;
        nextDepth = depth;
      }
    }

    const res = minimax(
      nextBoard,
      nextTurn,
      nextDepth,
      alpha,
      beta,
      startTime,
      timeBudget,
      rules,
      originalPlayer
    );

    if (player === originalPlayer) {
      if (res.score > bestScore) {
        bestScore = res.score;
        bestMove = m;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (res.score < bestScore) {
        bestScore = res.score;
        bestMove = m;
      }
      beta = Math.min(beta, bestScore);
    }

    if (beta <= alpha) break;
  }

  const flag = bestScore <= alpha ? 'UPPER' : bestScore >= beta ? 'LOWER' : 'EXACT';
  if (TT.size > MAX_TT_ENTRIES) TT.clear();
  TT.set(hash, { depth, score: bestScore, flag });

  return { move: bestMove, score: bestScore };
}

``


### Arquivo: .\src\lib\ai\worker.ts
``typescript
import { minimax, resetTT } from './checkersAI';
import { generateLegalMoves } from '../engine/checkers';

self.addEventListener('message', (e: MessageEvent) => {
  const data = e.data;

  if (data?.type === 'reset') {
    resetTT();
    return;
  }

  const { board, player, difficulty, maxDepth, budget, rules } = data;
  const start = performance.now();

  const legal = generateLegalMoves(board, player, rules);
  if (!legal.length) {
    self.postMessage({ move: null });
    return;
  }

  if (difficulty === 'facil') {
    const idx = Math.floor(Math.random() * legal.length);
    self.postMessage({ move: legal[idx] });
    return;
  }

  let bestMove = legal[0];
  for (let d = 1; d <= maxDepth; d++) {
    const { move } = minimax(board, player, d, -1e9, 1e9, start, budget, rules, player);
    if (move) bestMove = move;
    if (performance.now() - start > budget) break;
  }

  self.postMessage({ move: bestMove });
});

``


### Arquivo: .\src\lib\chess\ai\minimax.ts
``typescript
import { GameState, Move, Color, PieceType } from '@/lib/chess/types';
import { generateLegalMoves } from '@/lib/chess/movegen';
import { makeMove } from '@/lib/chess/makeMove';
import { stateHash } from '@/lib/chess/hash';
import { getResult } from '@/lib/chess/result';

const PIECE_VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Piece-Square Tables — convenção: linha 0 = rank 8, linha 7 = rank 1 (visão padrão)
const PST: Record<string, number[]> = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 10, 10, 10, 10, 10, 10,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0,
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20,
  ],
};

function pstValue(type: PieceType, sq: number, color: Color): number {
  const table = PST[type];
  if (!table) return 0;
  const rank = Math.floor(sq / 8); // 0 = rank1 ... 7 = rank8
  const file = sq % 8;
  const idx = color === 'w' ? (7 - rank) * 8 + file : rank * 8 + file;
  return table[idx];
}

function evaluate(state: GameState, perspective: Color, legalForTurn: Move[]): number {
  let score = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = state.board[sq];
    if (!p) continue;
    const sign = p.color === perspective ? 1 : -1;
    score += sign * (PIECE_VALUES[p.type] + pstValue(p.type, sq, p.color));
  }

  // Mobilidade do lado que tem a vez neste nó
  const mobilitySign = perspective === state.turn ? 1 : -1;
  score += mobilitySign * legalForTurn.length * 2;

  return score;
}

type TTFlag = 'EXACT' | 'LOWER' | 'UPPER';
type TTEntry = { depth: number; score: number; flag: TTFlag };

const TT = new Map<number, TTEntry>();
const MAX_TT_ENTRIES = 200_000;

export function resetTT() {
  TT.clear();
}

function ttKey(hash: number, perspective: Color): number {
  // Mistura a perspectiva no hash: nunca reaproveita uma avaliação
  // calculada para o lado errado (segurança caso a IA jogue de brancas no futuro)
  return perspective === 'w' ? hash : (hash ^ 0x9e3779b1) >>> 0;
}

export function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  startTime: number,
  timeBudget: number,
  perspective: Color
): { move: Move | null; score: number } {
  if (timeBudget && performance.now() - startTime > timeBudget) {
    return { move: null, score: 0 };
  }

  const hash = stateHash(state);
  const key = ttKey(hash, perspective);
  const tt = TT.get(key);
  if (tt && tt.depth >= depth) {
    if (tt.flag === 'EXACT') return { move: null, score: tt.score };
    if (tt.flag === 'LOWER') alpha = Math.max(alpha, tt.score);
    else if (tt.flag === 'UPPER') beta = Math.min(beta, tt.score);
    if (alpha >= beta) return { move: null, score: tt.score };
  }

  // ✅ Calcula os lances legais UMA vez só e reaproveita no getResult e no evaluate
  const legal = generateLegalMoves(state);
  const result = getResult(state, legal);

  if (depth === 0 || result !== '*') {
    const val = result === '*'
      ? evaluate(state, perspective, legal)
      : result === (perspective === 'w' ? '1-0' : '0-1')
        ? 900000 + depth   // prefere mates mais rápidos (usa menos profundidade restante)
        : result === (perspective === 'w' ? '0-1' : '1-0')
          ? -900000 - depth
          : 0;
    return { move: null, score: val };
  }

  // Ordenação MVV-LVA aproximada: captura de peça valiosa > promoção > resto
  const ordered = legal
    .map(m => {
      let priority = 0;
      const captured = state.board[m.to];
      if (captured) priority += 1000 + (PIECE_VALUES[captured.type] || 0);
      if (m.promotion) priority += 500 + (m.promotion === 'q' ? 400 : 0);
      return { m, priority };
    })
    .sort((a, b) => b.priority - a.priority)
    .map(o => o.m);

  let bestMove: Move | null = null;
  let bestScore = perspective === state.turn ? -Infinity : Infinity;

  for (const mv of ordered) {
    const { newState } = makeMove(state, mv);
    const { score } = minimax(newState, depth - 1, alpha, beta, startTime, timeBudget, perspective);

    if (state.turn === perspective) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = mv;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = mv;
      }
      beta = Math.min(beta, bestScore);
    }
    if (beta <= alpha) break;
  }

  const flag: TTFlag = bestScore <= alpha ? 'UPPER' : bestScore >= beta ? 'LOWER' : 'EXACT';
  if (TT.size > MAX_TT_ENTRIES) TT.clear();
  TT.set(key, { depth, score: bestScore, flag });

  return { move: bestMove, score: bestScore };
}

``


### Arquivo: .\src\lib\chess\ai\worker.ts
``typescript
import { minimax, resetTT } from './minimax';
import { generateLegalMoves } from '../movegen';

self.addEventListener('message', (e: MessageEvent) => {
  const data = e.data;

  if (data?.type === 'reset') {
    resetTT();
    return;
  }

  const { state, difficulty, maxDepth, budget } = data;
  const start = performance.now();

  const legal = generateLegalMoves(state);
  if (!legal.length) {
    self.postMessage({ move: null });
    return;
  }

  if (difficulty === 'facil') {
    const idx = Math.floor(Math.random() * legal.length);
    self.postMessage({ move: legal[idx] });
    return;
  }

  let bestMove = null;
  for (let d = 1; d <= maxDepth; d++) {
    const { move } = minimax(state, d, -1e9, 1e9, start, budget, state.turn);
    if (move) bestMove = move;
    if (performance.now() - start > budget) break;
  }

  self.postMessage({ move: bestMove });
});

``


### Arquivo: .\src\lib\chess\ai.ts
``typescript
import { GameState, Move } from './types';
import { minimax, resetTT } from './ai/minimax';
import { generateLegalMoves } from './movegen';

export type Difficulty = 'facil' | 'medio' | 'dificil';

let worker: Worker | null = null;
let workerFailed = false;

function initWorker() {
  if (worker || workerFailed) return;
  try {
    worker = new Worker(new URL('./ai/worker.ts', import.meta.url));
  } catch (err) {
    console.warn('Worker for chess failed, using main thread', err);
    workerFailed = true;
  }
}

/** Limpa a Transposition Table — chame ao reiniciar a partida. */
export function resetChessAI() {
  resetTT();
  if (worker) {
    worker.postMessage({ type: 'reset' });
  }
}

export async function askChessAI(state: GameState, difficulty: Difficulty): Promise<Move | null> {
  initWorker();

  const maxDepth = difficulty === 'facil' ? 2 : difficulty === 'medio' ? 4 : 5;
  const budget = difficulty === 'dificil' ? 1200 : difficulty === 'medio' ? 600 : 300;

  if (!workerFailed && worker) {
    return new Promise<Move | null>((resolve, reject) => {
      const onMsg = (e: MessageEvent) => {
        clean();
        resolve(e.data.move ?? null);
      };
      const onErr = (e: ErrorEvent) => {
        clean();
        console.warn('Worker error', e);
        workerFailed = true;
        fallback().then(resolve).catch(reject);
      };
      const clean = () => {
        worker?.removeEventListener('message', onMsg);
        worker?.removeEventListener('error', onErr);
      };
      worker?.addEventListener('message', onMsg);
      worker?.addEventListener('error', onErr);
      worker?.postMessage({ state, difficulty, maxDepth, budget });
    });
  }

  return fallback();

  async function fallback(): Promise<Move | null> {
    const start = performance.now();
    const legal = generateLegalMoves(state);
    if (!legal.length) return null;

    if (difficulty === 'facil') {
      const idx = Math.floor(Math.random() * legal.length);
      return legal[idx];
    }

    let bestMove: Move | null = null;
    for (let d = 1; d <= maxDepth; d++) {
      const { move } = minimax(state, d, -1e9, 1e9, start, budget, state.turn);
      if (move) bestMove = move;
      if (performance.now() - start > budget) break;
    }
    return bestMove;
  }
}

``


### Arquivo: .\src\lib\chess\attacks.ts
``typescript
import { GameState, Color, Square } from './types';

export function opposite(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}

export function isOnBoard(sq: Square): boolean {
  return sq >= 0 && sq < 64;
}

export function getRank(sq: Square): number {
  return Math.floor(sq / 8);
}

export function getFile(sq: Square): number {
  return sq % 8;
}

const KNIGHT_OFFSETS = [15, 17, 6, 10, -15, -17, -6, -10];
const BISHOP_OFFSETS = [7, 9, -7, -9];
const ROOK_OFFSETS = [8, 1, -8, -1];
const QUEEN_OFFSETS = [...BISHOP_OFFSETS, ...ROOK_OFFSETS];
const KING_OFFSETS = QUEEN_OFFSETS;

function isSquareAttackedByDirection(
  board: GameState['board'],
  sq: Square,
  color: Color,
  offsets: number[],
  isRay: boolean
): boolean {
  const r = getRank(sq);
  const f = getFile(sq);

  for (const offset of offsets) {
    let currentSq = sq;
    let cr = r;
    let cf = f;

    while (true) {
      currentSq += offset;
      if (!isOnBoard(currentSq)) break;

      const nr = getRank(currentSq);
      const nf = getFile(currentSq);
      if (Math.abs(nr - cr) > 1 || Math.abs(nf - cf) > 1) break; // Wrapped around

      const piece = board[currentSq];
      if (piece) {
        if (piece.color === color) {
          const type = piece.type;
          if (isRay) {
            if (
              (type === 'q') ||
              (type === 'r' && (offset === 1 || offset === -1 || offset === 8 || offset === -8)) ||
              (type === 'b' && (offset === 7 || offset === 9 || offset === -7 || offset === -9))
            ) {
              return true;
            }
          } else {
            if (type === 'k') return true;
          }
        }
        break;
      }

      if (!isRay) break;
      cr = nr;
      cf = nf;
    }
  }
  return false;
}

export function isSquareAttacked(state: GameState, sq: Square, color: Color): boolean {
  const board = state.board;
  const r = getRank(sq);
  const f = getFile(sq);

  // Pawn attacks
  const pawnDir = color === 'w' ? -1 : 1;
  const pawnRank = r + pawnDir;
  if (pawnRank >= 0 && pawnRank < 8) {
    if (f > 0) {
      const p = board[pawnRank * 8 + (f - 1)];
      if (p && p.color === color && p.type === 'p') return true;
    }
    if (f < 7) {
      const p = board[pawnRank * 8 + (f + 1)];
      if (p && p.color === color && p.type === 'p') return true;
    }
  }

  // Knight attacks
  for (const offset of KNIGHT_OFFSETS) {
    const targetSq = sq + offset;
    if (isOnBoard(targetSq)) {
      const tr = getRank(targetSq);
      const tf = getFile(targetSq);
      if (Math.abs(tr - r) <= 2 && Math.abs(tf - f) <= 2) {
        const p = board[targetSq];
        if (p && p.color === color && p.type === 'n') return true;
      }
    }
  }

  // Rays (Rook, Bishop, Queen) and King
  if (isSquareAttackedByDirection(board, sq, color, QUEEN_OFFSETS, true)) return true;
  if (isSquareAttackedByDirection(board, sq, color, KING_OFFSETS, false)) return true;

  return false;
}

``


### Arquivo: .\src\lib\chess\fen.ts
``typescript
import { GameState, Piece, Color, PieceType, Square } from './types';

export function parseFEN(fen: string): GameState {
  const parts = fen.trim().split(/\s+/);
  if (parts.length !== 6) throw new Error('Invalid FEN');

  const [boardFen, turnFen, castlingFen, epFen, halfMoveFen, fullMoveFen] = parts;

  const board: (Piece | null)[] = new Array(64).fill(null);
  const rows = boardFen.split('/');
  if (rows.length !== 8) throw new Error('Invalid FEN board');

  for (let r = 0; r < 8; r++) {
    const rank = 7 - r; // FEN starts at rank 8
    let f = 0;
    for (const char of rows[r]) {
      if (/\d/.test(char)) {
        f += parseInt(char, 10);
      } else {
        const type = char.toLowerCase() as PieceType;
        const color = char === char.toUpperCase() ? 'w' : 'b';
        board[rank * 8 + f] = { type, color };
        f++;
      }
    }
  }

  const turn: Color = turnFen === 'w' ? 'w' : 'b';

  const castling = {
    w: { k: castlingFen.includes('K'), q: castlingFen.includes('Q') },
    b: { k: castlingFen.includes('k'), q: castlingFen.includes('q') }
  };

  let enPassant: Square | null = null;
  if (epFen !== '-') {
    const file = epFen.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = epFen.charCodeAt(1) - '1'.charCodeAt(0);
    enPassant = rank * 8 + file;
  }

  const halfMoveClock = parseInt(halfMoveFen, 10);
  const fullMoveNumber = parseInt(fullMoveFen, 10);

  return { board, turn, castling, enPassant, halfMoveClock, fullMoveNumber };
}

export function toFEN(state: GameState): string {
  let fen = '';
  for (let r = 7; r >= 0; r--) {
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const piece = state.board[r * 8 + f];
      if (!piece) {
        empty++;
      } else {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        fen += piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
      }
    }
    if (empty > 0) fen += empty;
    if (r > 0) fen += '/';
  }

  fen += ' ' + state.turn + ' ';

  let castling = '';
  if (state.castling.w.k) castling += 'K';
  if (state.castling.w.q) castling += 'Q';
  if (state.castling.b.k) castling += 'k';
  if (state.castling.b.q) castling += 'q';
  if (castling === '') castling = '-';
  fen += castling + ' ';

  if (state.enPassant === null) {
    fen += '-';
  } else {
    const file = String.fromCharCode('a'.charCodeAt(0) + (state.enPassant % 8));
    const rank = String.fromCharCode('1'.charCodeAt(0) + Math.floor(state.enPassant / 8));
    fen += file + rank;
  }

  fen += ' ' + state.halfMoveClock + ' ' + state.fullMoveNumber;
  return fen;
}

``


### Arquivo: .\src\lib\chess\hash.ts
``typescript
import { GameState } from './types';

// Simple seeded PRNG to ensure reproducibility
class PRNG {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    // xorshift32ish
    this.seed ^= this.seed << 13;
    this.seed ^= this.seed >>> 17;
    this.seed ^= this.seed << 5;
    return this.seed >>> 0;
  }
}

const prng = new PRNG(12345);

const ZOBRIST = {
  pieces: {} as Record<string, number[]>, // piece string -> 64 numbers
  turn: prng.next(),
  castling: {
    w: { k: prng.next(), q: prng.next() },
    b: { k: prng.next(), q: prng.next() }
  },
  enPassant: [] as number[]
};

const pieceTypes = ['p', 'n', 'b', 'r', 'q', 'k'];
const colors = ['w', 'b'];

for (const c of colors) {
  for (const t of pieceTypes) {
    const key = c + t;
    ZOBRIST.pieces[key] = [];
    for (let i = 0; i < 64; i++) {
      ZOBRIST.pieces[key].push(prng.next());
    }
  }
}

for (let i = 0; i < 64; i++) {
  ZOBRIST.enPassant.push(prng.next());
}

export function stateHash(state: GameState): number {
  let hash = 0;

  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (p) {
      hash ^= ZOBRIST.pieces[p.color + p.type][i];
    }
  }

  if (state.turn === 'w') {
    hash ^= ZOBRIST.turn;
  }

  if (state.castling.w.k) hash ^= ZOBRIST.castling.w.k;
  if (state.castling.w.q) hash ^= ZOBRIST.castling.w.q;
  if (state.castling.b.k) hash ^= ZOBRIST.castling.b.k;
  if (state.castling.b.q) hash ^= ZOBRIST.castling.b.q;

  if (state.enPassant !== null) {
    hash ^= ZOBRIST.enPassant[state.enPassant];
  }

  return hash >>> 0; // ensure unsigned 32-bit
}

``


### Arquivo: .\src\lib\chess\index.ts
``typescript
export * from './types';
export * from './fen';
export * from './attacks';
export * from './movegen';
export * from './makeMove';
export * from './result';
export * from './hash';

``


### Arquivo: .\src\lib\chess\makeMove.ts
``typescript
import { GameState, Move, MoveResult, Piece, PieceType } from './types';
import { getFile, getRank } from './attacks';
import { stateHash } from './hash';

export function makeMove(state: GameState, move: Move): MoveResult {
  const currentHash = stateHash(state);
  const newHistory = [...(state.history || []), currentHash];

  const newState: GameState = {
    board: [...state.board],
    turn: state.turn === 'w' ? 'b' : 'w',
    castling: {
      w: { ...state.castling.w },
      b: { ...state.castling.b },
    },
    enPassant: null,
    halfMoveClock: state.halfMoveClock + 1,
    fullMoveNumber: state.turn === 'b' ? state.fullMoveNumber + 1 : state.fullMoveNumber,
    history: newHistory,
  };

  const piece = state.board[move.from];
  if (!piece) throw new Error('No piece at source square');

  let captured = state.board[move.to] || undefined;
  let isEnPassant = false;
  let isPromotion = false;
  let isCastling = false;

  // En Passant capture
  if (piece.type === 'p' && move.to === state.enPassant) {
    const captureSq = state.turn === 'w' ? move.to - 8 : move.to + 8;
    captured = newState.board[captureSq] || undefined;
    newState.board[captureSq] = null;
    isEnPassant = true;
  }

  // Update half-move clock
  if (piece.type === 'p' || captured) {
    newState.halfMoveClock = 0;
  }

  // En Passant target square
  if (piece.type === 'p' && Math.abs(getRank(move.from) - getRank(move.to)) === 2) {
    newState.enPassant = state.turn === 'w' ? move.from + 8 : move.from - 8;
  }

  // Move the piece
  newState.board[move.to] = piece;
  newState.board[move.from] = null;

  // Promotion
  if (piece.type === 'p') {
    const r = getRank(move.to);
    if (r === 0 || r === 7) {
      isPromotion = true;
      newState.board[move.to] = { type: move.promotion || 'q', color: state.turn };
    }
  }

  // Castling
  if (piece.type === 'k') {
    const fDiff = getFile(move.to) - getFile(move.from);
    if (Math.abs(fDiff) === 2) {
      isCastling = true;
      const r = getRank(move.to);
      if (fDiff > 0) {
        // Kingside
        newState.board[r * 8 + 5] = newState.board[r * 8 + 7];
        newState.board[r * 8 + 7] = null;
      } else {
        // Queenside
        newState.board[r * 8 + 3] = newState.board[r * 8 + 0];
        newState.board[r * 8 + 0] = null;
      }
    }
    // Revoke castling rights
    newState.castling[state.turn].k = false;
    newState.castling[state.turn].q = false;
  }

  // Revoke castling rights on rook moves/captures
  const revokeCastling = (sq: number) => {
    if (sq === 0) newState.castling.w.q = false; // a1
    else if (sq === 7) newState.castling.w.k = false; // h1
    else if (sq === 56) newState.castling.b.q = false; // a8
    else if (sq === 63) newState.castling.b.k = false; // h8
  };
  revokeCastling(move.from);
  revokeCastling(move.to);

  return { newState, captured, isEnPassant, isPromotion, isCastling };
}


``


### Arquivo: .\src\lib\chess\movegen.ts
``typescript
import { GameState, Move, Square } from './types';
import { isSquareAttacked, isOnBoard, getRank, getFile, opposite } from './attacks';
import { makeMove } from './makeMove';

export function generatePseudoLegalMoves(state: GameState): Move[] {
  const moves: Move[] = [];
  const color = state.turn;

  for (let sq = 0; sq < 64; sq++) {
    const piece = state.board[sq];
    if (!piece || piece.color !== color) continue;

    const r = getRank(sq);
    const f = getFile(sq);

    if (piece.type === 'p') {
      const dir = color === 'w' ? 1 : -1;
      const startRank = color === 'w' ? 1 : 6;
      const promRank = color === 'w' ? 7 : 0;

      // Single push
      const oneStep = sq + dir * 8;
      if (isOnBoard(oneStep) && !state.board[oneStep]) {
        addPawnMoves(moves, sq, oneStep, getRank(oneStep) === promRank);
        // Double push
        if (r === startRank) {
          const twoStep = sq + dir * 16;
          if (!state.board[twoStep]) {
            moves.push({ from: sq, to: twoStep });
          }
        }
      }

      // Captures
      for (const fOff of [-1, 1]) {
        if (f + fOff >= 0 && f + fOff < 8) {
          const capSq = sq + dir * 8 + fOff;
          if (isOnBoard(capSq)) {
            const target = state.board[capSq];
            if (target && target.color !== color) {
              addPawnMoves(moves, sq, capSq, getRank(capSq) === promRank);
            } else if (capSq === state.enPassant) {
              moves.push({ from: sq, to: capSq });
            }
          }
        }
      }
    } else if (piece.type === 'n') {
      const offsets = [15, 17, 6, 10, -15, -17, -6, -10];
      for (const off of offsets) {
        const target = sq + off;
        if (isOnBoard(target)) {
          const tr = getRank(target);
          const tf = getFile(target);
          if (Math.abs(tr - r) <= 2 && Math.abs(tf - f) <= 2) {
            const tPiece = state.board[target];
            if (!tPiece || tPiece.color !== color) {
              moves.push({ from: sq, to: target });
            }
          }
        }
      }
    } else if (piece.type === 'k') {
      const offsets = [8, 1, -8, -1, 7, 9, -7, -9];
      for (const off of offsets) {
        const target = sq + off;
        if (isOnBoard(target)) {
          const tr = getRank(target);
          const tf = getFile(target);
          if (Math.abs(tr - r) <= 1 && Math.abs(tf - f) <= 1) {
            const tPiece = state.board[target];
            if (!tPiece || tPiece.color !== color) {
              moves.push({ from: sq, to: target });
            }
          }
        }
      }

      // Castling
      const opp = opposite(color);
      const row = color === 'w' ? 0 : 7;
      if (sq === row * 8 + 4) { // King is at starting pos
        if (state.castling[color].k) {
          if (!state.board[row * 8 + 5] && !state.board[row * 8 + 6]) {
            if (!isSquareAttacked(state, sq, opp) &&
                !isSquareAttacked(state, sq + 1, opp) &&
                !isSquareAttacked(state, sq + 2, opp)) {
              moves.push({ from: sq, to: sq + 2 });
            }
          }
        }
        if (state.castling[color].q) {
          if (!state.board[row * 8 + 3] && !state.board[row * 8 + 2] && !state.board[row * 8 + 1]) {
            if (!isSquareAttacked(state, sq, opp) &&
                !isSquareAttacked(state, sq - 1, opp) &&
                !isSquareAttacked(state, sq - 2, opp)) {
              moves.push({ from: sq, to: sq - 2 });
            }
          }
        }
      }
    } else { // Bishop, Rook, Queen
      let dirs: number[] = [];
      if (piece.type === 'b' || piece.type === 'q') dirs.push(7, 9, -7, -9);
      if (piece.type === 'r' || piece.type === 'q') dirs.push(8, 1, -8, -1);

      for (const dir of dirs) {
        let currentSq = sq;
        let cr = r;
        let cf = f;

        while (true) {
          currentSq += dir;
          if (!isOnBoard(currentSq)) break;

          const nr = getRank(currentSq);
          const nf = getFile(currentSq);
          if (Math.abs(nr - cr) > 1 || Math.abs(nf - cf) > 1) break;

          const tPiece = state.board[currentSq];
          if (!tPiece) {
            moves.push({ from: sq, to: currentSq });
          } else {
            if (tPiece.color !== color) {
              moves.push({ from: sq, to: currentSq });
            }
            break;
          }
          cr = nr;
          cf = nf;
        }
      }
    }
  }

  return moves;
}

function addPawnMoves(moves: Move[], from: Square, to: Square, isPromotion: boolean) {
  if (isPromotion) {
    moves.push({ from, to, promotion: 'q' });
    moves.push({ from, to, promotion: 'r' });
    moves.push({ from, to, promotion: 'b' });
    moves.push({ from, to, promotion: 'n' });
  } else {
    moves.push({ from, to });
  }
}

export function generateLegalMoves(state: GameState): Move[] {
  const pseudoMoves = generatePseudoLegalMoves(state);
  const legalMoves: Move[] = [];
  const opp = opposite(state.turn);

  for (const move of pseudoMoves) {
    const { newState } = makeMove(state, move);
    // Find king square
    let kingSq = -1;
    for (let i = 0; i < 64; i++) {
      const p = newState.board[i];
      if (p && p.type === 'k' && p.color === state.turn) {
        kingSq = i;
        break;
      }
    }
    if (kingSq !== -1 && !isSquareAttacked(newState, kingSq, opp)) {
      legalMoves.push(move);
    }
  }

  return legalMoves;
}

``


### Arquivo: .\src\lib\chess\notation.ts
``typescript
import { GameState, Move, MoveResult, PieceType, Piece } from './types';
import { generateLegalMoves } from './movegen';
import { getFile, getRank, isSquareAttacked, opposite } from './attacks';

const FILE_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function squareToAlgebraic(sq: number): string {
  const file = FILE_LETTERS[sq % 8];
  const rank = Math.floor(sq / 8) + 1;
  return `${file}${rank}`;
}

const PIECE_LETTER: Record<PieceType, string> = {
  p: '', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K',
};

/**
 * Converte um Move em notação algébrica padrão (SAN).
 * Ex: e4, Nf3, Bxc4, O-O, O-O-O, e8=Q, exd5, Qh4+, Rxe8#
 */
export function moveToSAN(
  prevState: GameState,
  move: Move,
  moveResult: MoveResult
): string {
  const piece = prevState.board[move.from];
  if (!piece) return '?';

  // Roque
  if (moveResult.isCastling) {
    const isKingside = move.to > move.from;
    let san = isKingside ? 'O-O' : 'O-O-O';
    return san + checkSuffix(moveResult);
  }

  const letter = PIECE_LETTER[piece.type];
  const toSq = squareToAlgebraic(move.to);
  const isCapture = !!moveResult.captured;

  let san = '';

  if (piece.type === 'p') {
    // Peão: se captura, mostra a coluna de origem (ex: exd5)
    if (isCapture) {
      san = `${FILE_LETTERS[getFile(move.from)]}x${toSq}`;
    } else {
      san = toSq;
    }
    if (move.promotion) {
      san += `=${PIECE_LETTER[move.promotion] || 'Q'}`;
    }
  } else {
    // Outras peças: precisa checar ambiguidade (duas peças iguais podem ir ao mesmo lugar)
    const disambiguation = getDisambiguation(prevState, move, piece);
    san = `${letter}${disambiguation}${isCapture ? 'x' : ''}${toSq}`;
  }

  return san + checkSuffix(moveResult);
}

/**
 * Verifica se o movimento causa xeque ou xeque-mate no oponente,
 * para adicionar '+' (xeque) ou '#' (mate) ao final da notação.
 */
function checkSuffix(moveResult: MoveResult): string {
  const s = moveResult.newState;
  let kingSq = -1;
  for (let i = 0; i < 64; i++) {
    const p = s.board[i];
    if (p && p.type === 'k' && p.color === s.turn) {
      kingSq = i;
      break;
    }
  }
  if (kingSq === -1) return '';

  const inCheck = isSquareAttacked(s, kingSq, opposite(s.turn));
  if (!inCheck) return '';

  const legal = generateLegalMoves(s);
  return legal.length === 0 ? '#' : '+';
}

/**
 * Determina se precisamos qualificar a peça de origem (ex: Nbd7, R1e2)
 * quando duas ou mais peças iguais podem alcançar a mesma casa de destino.
 */
function getDisambiguation(state: GameState, move: Move, piece: Piece): string {
  const legal = generateLegalMoves(state);
  const rivals = legal.filter(m =>
    m.to === move.to &&
    m.from !== move.from &&
    state.board[m.from]?.type === piece.type &&
    state.board[m.from]?.color === piece.color
  );

  if (rivals.length === 0) return '';

  const fromFile = getFile(move.from);
  const fromRank = getRank(move.from);
  const sameFile = rivals.some(m => getFile(m.from) === fromFile);
  const sameRank = rivals.some(m => getRank(m.from) === fromRank);

  if (!sameFile) return FILE_LETTERS[fromFile];        // Ex: Nbd7
  if (!sameRank) return String(fromRank + 1);          // Ex: N1d2
  return `${FILE_LETTERS[fromFile]}${fromRank + 1}`;   // Ex: Nb1d2 (caso raríssimo)
}

``


### Arquivo: .\src\lib\chess\result.ts
``typescript
import { GameState, Color, Move } from './types';
import { generateLegalMoves } from './movegen';
import { isSquareAttacked, opposite } from './attacks';
import { stateHash } from './hash';

export function isInsufficientMaterial(state: GameState): boolean {
  const pieces = {
    w: { n: 0, b: 0, r: 0, q: 0, p: 0, b_sq: [] as number[] },
    b: { n: 0, b: 0, r: 0, q: 0, p: 0, b_sq: [] as number[] }
  };

  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (p) {
      if (p.type === 'k') continue;
      if (p.type === 'p') pieces[p.color].p++;
      if (p.type === 'n') pieces[p.color].n++;
      if (p.type === 'b') {
        pieces[p.color].b++;
        pieces[p.color].b_sq.push(i);
      }
      if (p.type === 'r') pieces[p.color].r++;
      if (p.type === 'q') pieces[p.color].q++;
    }
  }

  if (
    pieces.w.p > 0 || pieces.b.p > 0 ||
    pieces.w.r > 0 || pieces.b.r > 0 ||
    pieces.w.q > 0 || pieces.b.q > 0
  ) {
    return false;
  }

  if (pieces.w.n === 0 && pieces.w.b === 0 && pieces.b.n === 0 && pieces.b.b === 0) {
    return true;
  }

  const wPieces = pieces.w.n + pieces.w.b;
  const bPieces = pieces.b.n + pieces.b.b;

  if ((wPieces === 1 && bPieces === 0) || (wPieces === 0 && bPieces === 1)) {
    return true;
  }

  if (pieces.w.b === 1 && pieces.b.b === 1 && pieces.w.n === 0 && pieces.b.n === 0) {
    const wSquareColor = (Math.floor(pieces.w.b_sq[0] / 8) + (pieces.w.b_sq[0] % 8)) % 2;
    const bSquareColor = (Math.floor(pieces.b.b_sq[0] / 8) + (pieces.b.b_sq[0] % 8)) % 2;
    if (wSquareColor === bSquareColor) {
      return true;
    }
  }

  return false;
}

export type GameResult = '*' | '1-0' | '0-1' | '1/2-1/2';

/**
 * @param legalMoves - opcional. Se já foram calculados (ex: dentro da IA),
 * passe aqui para evitar recalcular generateLegalMoves de novo.
 */
export function getResult(state: GameState, legalMoves?: Move[]): GameResult {
  const legal = legalMoves ?? generateLegalMoves(state);
  const opp = opposite(state.turn);
  let kingSq = -1;
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (p && p.type === 'k' && p.color === state.turn) {
      kingSq = i;
      break;
    }
  }

  const isCheck = kingSq !== -1 && isSquareAttacked(state, kingSq, opp);

  if (legal.length === 0) {
    if (isCheck) {
      return state.turn === 'w' ? '0-1' : '1-0';
    }
    return '1/2-1/2'; // Afogamento (Stalemate)
  }

  if (state.halfMoveClock >= 100) {
    return '1/2-1/2'; // Regra dos 50 lances
  }

  if (isInsufficientMaterial(state)) {
    return '1/2-1/2';
  }

  if (state.history) {
    const currentHash = stateHash(state);
    let count = 1;
    for (const h of state.history) {
      if (h === currentHash) count++;
    }
    if (count >= 3) return '1/2-1/2'; // Repetição tripla
  }

  return '*';
}

``


### Arquivo: .\src\lib\chess\sound.ts
``typescript
'use client';

type SoundName = 'move' | 'capture' | 'castle' | 'promote' | 'check' | 'gameEnd' | 'gameStart' | 'illegal';

const SOUND_FILES: Record<SoundName, string> = {
  move: '/sounds/move-self.mp3',
  capture: '/sounds/capture.mp3',
  castle: '/sounds/castle.mp3',
  promote: '/sounds/promote.mp3',
  check: '/sounds/move-check.mp3',
  gameEnd: '/sounds/game-end.mp3',
  gameStart: '/sounds/game-start.mp3',
  illegal: '/sounds/illegal.mp3',
};

const cache: Partial<Record<SoundName, HTMLAudioElement>> = {};

function getAudio(name: SoundName): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!cache[name]) {
    try {
      const audio = new Audio(SOUND_FILES[name]);
      audio.preload = 'auto';
      audio.volume = 0.6;
      cache[name] = audio;
    } catch {
      return null;
    }
  }
  return cache[name] ?? null;
}

/** Toca um efeito sonoro real de peça de xadrez. Falha silenciosamente
 * se o arquivo não existir ou o navegador ainda não permitir autoplay. */
export function playChessSound(name: SoundName) {
  const base = getAudio(name);
  if (!base) return;
  try {
    // Clona o elemento para permitir sons sobrepostos (ex: som de
    // captura tocando enquanto o anterior ainda não terminou).
    const instance = base.cloneNode(true) as HTMLAudioElement;
    instance.volume = base.volume;
    void instance.play().catch(() => {});
  } catch {
    /* ignora */
  }
}

/** Decide qual som tocar com base no resultado do lance. */
export function resolveMoveSound(opts: {
  captured?: boolean;
  isCastling?: boolean;
  isPromotion?: boolean;
  isCheck?: boolean;
  isGameOver?: boolean;
}): SoundName {
  if (opts.isGameOver) return 'gameEnd';
  if (opts.isPromotion) return 'promote';
  if (opts.isCastling) return 'castle';
  if (opts.isCheck) return 'check';
  if (opts.captured) return 'capture';
  return 'move';
}

``


### Arquivo: .\src\lib\chess\types.ts
``typescript
export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Piece {
  type: PieceType;
  color: Color;
}

export type Square = number; // 0-63 (a1=0, h8=63)

export interface CastlingRights {
  w: { k: boolean; q: boolean };
  b: { k: boolean; q: boolean };
}

export interface GameState {
  board: (Piece | null)[];
  turn: Color;
  castling: CastlingRights;
  enPassant: Square | null;
  halfMoveClock: number;
  fullMoveNumber: number;
  history?: number[];
}

export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceType;
}

export interface MoveResult {
  newState: GameState;
  captured?: Piece;
  isEnPassant?: boolean;
  isPromotion?: boolean;
  isCastling?: boolean;
}

``


### Arquivo: .\src\lib\engine\checkers.ts
``typescript
// ------------------------------------------------------------------
// Lógica completa do jogo de damas (Checkers)
// ------------------------------------------------------------------

import type { Board, Move, Pos, Cell, GameState, GameRules } from '../../types/checkers';

/* ------------------------------------------------------------------ */
/*                     Funções Auxiliares                             */
/* ------------------------------------------------------------------ */

export function createBoard(): Board {
  const board: Board = Array(8).fill(0).map(() => Array(8).fill(0));
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) board[r][c] = -1;
        else if (r > 4) board[r][c] = 1;
      }
    }
  }
  return board;
}

export function isInside([r, c]: Pos): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function belongsTo(piece: Cell, turn: 1 | -1): boolean {
  if (piece === 0) return false;
  return turn === 1 ? piece > 0 : piece < 0;
}

function isKing(piece: Cell): boolean {
  return piece === 2 || piece === -2;
}

function moveDirections(piece: Cell): Pos[] {
  if (isKing(piece)) {
    return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  }
  const p = piece > 0 ? 1 : -1;
  return p === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

function captureDirections(piece: Cell): Pos[] {
  return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
}

/* ------------------------------------------------------------------ */
/*                     Geração de movimentos legais                   */
/* ------------------------------------------------------------------ */

function getCapturesFrom(
  board: Board,
  r: number,
  c: number,
  turn: 1 | -1,
  rules: GameRules,
  visited: Pos[] = [],
  isCombo: boolean = false
): { move: Move; maxDescendant: number; fullPaths: Pos[][] }[] {
  const piece = board[r][c];
  if (piece === 0) return [];
  const isK = isKing(piece);

  // ✅ CORREÇÃO: a regra "comer para trás" agora vale SEMPRE (primeiro
  // lance ou continuação de combo), não só na primeira captura da vez.
  let dirs: Pos[];
  if (isK) {
    dirs = captureDirections(piece);
  } else {
    dirs = rules.canCaptureBackwards ? captureDirections(piece) : moveDirections(piece);
  }

  const paths: { move: Move; maxDescendant: number; fullPaths: Pos[][] }[] = [];

  for (const [dr, dc] of dirs) {
    let step = 1;
    let foundEnemy: Pos | null = null;

    while (true) {
      const currR = r + dr * step;
      const currC = c + dc * step;
      if (!isInside([currR, currC])) break;

      const currCell = board[currR][currC];

      if (currCell === 0) {
        if (foundEnemy) {
          const newBoard = board.map((row) => row.slice()) as Board;
          newBoard[r][c] = 0;
          newBoard[foundEnemy[0]][foundEnemy[1]] = 0;
          newBoard[currR][currC] = piece;

          const nextCaptures = getCapturesFrom(
            newBoard,
            currR,
            currC,
            turn,
            rules,
            [...visited, foundEnemy],
            true
          );

          let maxDesc = 0;
          let newFullPaths: Pos[][] = [];
          if (nextCaptures.length > 0) {
            maxDesc = Math.max(...nextCaptures.map((p) => p.maxDescendant));
            for (const nc of nextCaptures) {
              if (nc.fullPaths && nc.fullPaths.length > 0) {
                for (const fp of nc.fullPaths) {
                  newFullPaths.push([[currR, currC], ...fp]);
                }
              }
            }
          } else {
            newFullPaths.push([[currR, currC]]);
          }

          paths.push({
            move: {
              from: [r, c],
              to: [currR, currC],
              capture: foundEnemy,
              promotion: false,
            },
            maxDescendant: 1 + maxDesc,
            fullPaths: newFullPaths
          });

          if (isK && rules.kingStopsImmediately) break;
        }
        if (!isK) break;
      } else if (belongsTo(currCell, turn)) {
        break;
      } else {
        if (foundEnemy || visited.some((v) => v[0] === currR && v[1] === currC)) {
          break;
        }
        foundEnemy = [currR, currC];

        if (!isK) {
          const landR = currR + dr;
          const landC = currC + dc;
          if (!isInside([landR, landC]) || board[landR][landC] !== 0) {
            break;
          }
        }
      }
      step++;
    }
  }
  return paths;
}

export function generateLegalMoves(
  board: Board,
  turn: 1 | -1,
  rules: GameRules = { canCaptureBackwards: true, kingStopsImmediately: false },
  isCombo: boolean = false,
  startSquare?: Pos
): Move[] {
  let allCaptures: { move: Move; maxDescendant: number; fullPaths: Pos[][] }[] = [];

  if (startSquare) {
    const [r, c] = startSquare;
    if (belongsTo(board[r][c], turn)) {
      allCaptures = getCapturesFrom(board, r, c, turn, rules, [], isCombo);
    }
  } else {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (belongsTo(board[r][c], turn)) {
          allCaptures = allCaptures.concat(getCapturesFrom(board, r, c, turn, rules, [], isCombo));
        }
      }
    }
  }

  if (allCaptures.length > 0) {
    const maxCaps = Math.max(...allCaptures.map((c) => c.maxDescendant));
    const bestCaptures = allCaptures.filter((c) => c.maxDescendant === maxCaps);

    return bestCaptures.map((c) => ({
      ...c.move,
      promotion: c.maxDescendant === 1 ? willPromote(board[c.move.from[0]][c.move.from[1]], c.move.to, turn) : false,
      fullPaths: c.fullPaths
    }));
  }

  // Se estamos no meio de um combo (startSquare definido) e não há mais
  // capturas, a sequência acabou — não há mais lances a partir dessa peça.
  if (isCombo && startSquare) {
    return [];
  }

  const moves: Move[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!belongsTo(piece, turn)) continue;

      const dirs = moveDirections(piece);

      if (isKing(piece)) {
        for (const [dr, dc] of dirs) {
          let step = 1;
          while (true) {
            const currR = r + dr * step;
            const currC = c + dc * step;
            if (!isInside([currR, currC])) break;
            if (board[currR][currC] !== 0) break;

            moves.push({
              from: [r, c],
              to: [currR, currC],
              promotion: false,
            });
            step++;
          }
        }
      } else {
        for (const [dr, dc] of dirs) {
          const to: Pos = [r + dr, c + dc];
          if (!isInside(to)) continue;
          if (board[to[0]][to[1]] !== 0) continue;

          moves.push({
            from: [r, c],
            to,
            promotion: willPromote(piece, to, turn),
          });
        }
      }
    }
  }

  return moves;
}

function willPromote(piece: Cell, to: Pos, turn: 1 | -1): boolean {
  if (isKing(piece)) return false;
  return turn === 1 ? to[0] === 0 : to[0] === 7;
}

/* ------------------------------------------------------------------ */
/*                     Aplicar um movimento no board                  */
/* ------------------------------------------------------------------ */
export function applyMove(board: Board, move: Move, turn: 1 | -1): Board {
  const newBoard = board.map((row) => row.slice()) as Board;

  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  let piece = newBoard[fr][fc];

  newBoard[fr][fc] = 0;

  if (move.capture) {
    const [cr, cc] = move.capture;
    newBoard[cr][cc] = 0;
  }

  if (move.promotion) {
    piece = turn * 2;
  }

  newBoard[tr][tc] = piece as Cell;
  return newBoard;
}

/* ------------------------------------------------------------------ */
/*                     Detectar fim de partida                        */
/* ------------------------------------------------------------------ */
function countPieces(board: Board, turn: 1 | -1): number {
  return board.flat().filter((c) => belongsTo(c, turn)).length;
}

export function evaluateWinner(board: Board, turn: 1 | -1, rules: GameRules): 1 | -1 | null {
  const opponent = (turn * -1) as 1 | -1;
  const myPieces = countPieces(board, turn);
  const oppPieces = countPieces(board, opponent);

  if (myPieces === 0) return opponent;
  if (oppPieces === 0) return turn;

  const moves = generateLegalMoves(board, turn, rules);
  if (moves.length === 0) return opponent;

  return null;
}

/* ------------------------------------------------------------------ */
/*                     Função de step completa (CORRIGIDA)            */
/* ------------------------------------------------------------------ */
export function step(state: GameState, move: Move): GameState {
  const newBoard = applyMove(state.board, move, state.turn);
  const winner = evaluateWinner(newBoard, state.turn, state.rules);

  let nextTurn: 1 | -1;
  let legalMoves: Move[];

  if (winner) {
    // Jogo acabou — não há mais lances possíveis.
    nextTurn = state.turn;
    legalMoves = [];
  } else if (move.capture) {
    // ✅ CORREÇÃO: escopa corretamente os lances para a MESMA peça que
    // acabou de capturar, em vez de recalcular o tabuleiro inteiro.
    // Isso garante que o jogador seja forçado a continuar com a peça
    // certa durante uma captura múltipla — regra oficial das damas.
    const continuation = generateLegalMoves(
      newBoard,
      state.turn,
      state.rules,
      true,
      move.to
    );

    if (continuation.length > 0) {
      nextTurn = state.turn;         // combo continua com a mesma peça
      legalMoves = continuation;
    } else {
      nextTurn = (state.turn * -1) as 1 | -1;
      legalMoves = generateLegalMoves(newBoard, nextTurn, state.rules);
    }
  } else {
    nextTurn = (state.turn * -1) as 1 | -1;
    legalMoves = generateLegalMoves(newBoard, nextTurn, state.rules);
  }

  return {
    ...state,
    board: newBoard,
    turn: nextTurn,
    winner,
    legalMoves,
    justPromotedPos: move.promotion ? move.to : null,
  };
}

/* ------------------------------------------------------------------ */
/*                     Função de reset (novo jogo)                    */
/* ------------------------------------------------------------------ */
export function newGame(rules?: GameRules): GameState {
  const defaultRules = { canCaptureBackwards: true, kingStopsImmediately: false };
  const gameRules = rules || defaultRules;
  const board = createBoard();
  return {
    board,
    turn: 1,
    winner: null,
    rules: gameRules,
    legalMoves: generateLegalMoves(board, 1, gameRules),
    justPromotedPos: null,
  };
}

``


### Arquivo: .\src\types\checkers.d.ts
``typescript
// ------------------------------------------
// Representação do tabuleiro
// 0  = casa vazia
// 1  = peça verde (player 1)      — “tampinha verde”
// -1 = peça vermelha (player -1)  — “tampinha vermelha”
// 2  = dama verde   (king)
// -2 = dama vermelha (king)
// ------------------------------------------

export type Cell = 0 | 1 | -1 | 2 | -2;
export type Board = Cell[][]; // sempre 8x8

// coordenada de uma casa
export type Pos = [row: number, col: number];

// movimento simples ou captura
export type Move = {
  from: Pos;
  to: Pos;
  /** Se a jogada inclui captura, indica a posição da peça capturada */
  capture?: Pos;
  /** Se a peça chegou ao outro lado e virou dama */
  promotion?: boolean;
  /** Sequências completas de casas de pouso para combos */
  fullPaths?: Pos[][];
};

export interface GameRules {
  canCaptureBackwards: boolean;
  kingStopsImmediately: boolean;
}

// retorno da engine
export type GameState = {
  board: Board;
  turn: 1 | -1;          // 1 = verde (primeiro), -1 = vermelho
  winner: 1 | -1 | null; // null → jogo ainda ativo
  // lista de jogadas possíveis a partir do estado corrente
  legalMoves: Move[];
  justPromotedPos?: Pos | null;
  rules: GameRules;
};

``

