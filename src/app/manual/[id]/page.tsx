import React from 'react';
import Link from 'next/link';

export default async function ManualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fundo padrão de papel com noise para todas as telas de manual
  const VintageBackground = () => (
    <>
      <div className="fixed inset-0 bg-[#e8dcc4] -z-20" />
      <div className="fixed inset-0 pointer-events-none -z-10 mix-blend-multiply opacity-40"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
           }}
      />
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(58,34,24,0.4)_120%)]" />
    </>
  );

  if (id === 'damas') {
    return (
      <div className="min-h-screen text-[#3a2218] p-4 md:p-8 relative flex justify-center font-sans overflow-x-hidden">
        <VintageBackground />
        
        <div className="w-full max-w-5xl z-10 bg-[#fdf8ef] rounded-2xl border-8 border-[#3a2218] shadow-[16px_16px_0px_#3a2218] flex flex-col p-6 md:p-10 h-fit my-auto relative mt-8 md:mt-auto mb-8">
          
          <Link 
            href={`/?open=${id}`} 
            className="absolute -top-6 -right-6 bg-[#e11d48] text-white w-14 h-14 flex items-center justify-center rounded-full font-black shadow-[6px_6px_0px_#3a2218] hover:scale-110 active:scale-95 transition-all border-4 border-[#3a2218] text-2xl z-50"
            title="Fechar Manual"
          >
            X
          </Link>

          {/* Título Removido a pedido */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-black text-[#3a2218] uppercase tracking-wide mb-2 flex items-center gap-3">
                <span className="bg-[#4a8b54] text-[#fdf8ef] border-4 border-[#3a2218] w-10 h-10 flex items-center justify-center rounded-full text-xl shadow-[4px_4px_0px_#3a2218]">1</span> 
                Como Jogar
              </h2>

              <section className="bg-[#e8dcc4] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#3a2218]">
                <h3 className="text-xl font-black mb-2 text-[#3a2218] uppercase">Objetivo & Tabuleiro</h3>
                <p className="text-base font-bold mb-2 text-[#3a2218]/80">Capture todas as peças do adversário para vencer a partida.</p>
                <p className="text-base font-bold text-[#3a2218]/80">O jogo acontece em um tabuleiro 8x8. As peças se movem apenas nas <strong>casas escuras</strong> na diagonal.</p>
              </section>

              <section className="bg-[#e8dcc4] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#3a2218]">
                <h3 className="text-xl font-black mb-2 text-[#3a2218] uppercase">Peças e Damas</h3>
                <p className="text-base font-bold mb-2 text-[#3a2218]/80">Peças normais andam apenas uma casa por vez, para frente.</p>
                <p className="text-base font-bold mb-2 text-[#3a2218]/80">Ao alcançar a última fileira do lado adversário, a peça é transformada em Dama. Ela ganha a habilidade de andar várias casas de uma vez, tanto para frente quanto para trás.</p>
              </section>
            </div>

            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-black text-[#3a2218] uppercase tracking-wide mb-2 flex items-center gap-3">
                <span className="bg-[#4a8b54] text-[#fdf8ef] border-4 border-[#3a2218] w-10 h-10 flex items-center justify-center rounded-full text-xl shadow-[4px_4px_0px_#3a2218]">2</span> 
                Regras do Jogo
              </h2>

              <section className="bg-[#4a8b54] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#3a2218]">
                <h3 className="text-xl font-black mb-3 text-[#fdf8ef] uppercase">Regras de Captura</h3>
                <ul className="list-disc list-outside ml-5 space-y-2 text-base font-bold text-[#fdf8ef]/90">
                  <li>A captura é obrigatória. Se puder comer, deve comer.</li>
                  <li>Se após capturar houver outra captura disponível com a mesma peça, você deve continuar o combo (multi-captura).</li>
                  <li>Se duas peças puderem comer uma peça adversária, você é obrigado a escolher o caminho que capture o maior número de peças.</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'adugo') {
    return (
      <div className="min-h-screen text-[#3a2218] p-4 md:p-8 relative flex justify-center font-sans overflow-x-hidden">
        <VintageBackground />
        
        <div className="w-full max-w-6xl z-10 bg-[#fdf8ef] rounded-2xl border-8 border-[#3a2218] shadow-[16px_16px_0px_#3a2218] flex flex-col p-6 md:p-10 h-fit my-auto relative mt-8 md:mt-auto mb-8">
          
          <Link 
            href={`/?open=${id}`} 
            className="absolute -top-6 -right-6 bg-[#e11d48] text-white w-14 h-14 flex items-center justify-center rounded-full font-black shadow-[6px_6px_0px_#3a2218] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_#3a2218] active:translate-x-0 active:translate-y-0 active:shadow-[0px_0px_0px_#3a2218] transition-all border-4 border-[#3a2218] text-2xl z-50"
            title="Fechar Manual"
          >
            X
          </Link>

          {/* Cabeçalho Temático */}
          <div className="text-center mb-8 border-b-4 border-[#3a2218] pb-6 relative">
            <h1 className="text-4xl md:text-6xl font-black uppercase text-[#3a2218] tracking-widest drop-shadow-[3px_3px_0px_#c49a6c]">
              O Jogo da Onça
            </h1>
            <p className="text-lg text-[#3a2218]/80 mt-2 font-black uppercase tracking-widest">
              Adugo — A Caçada na Selva
            </p>
            {/* Elemento decorativo: Pegadas */}
            <div className="absolute top-0 right-4 opacity-10 text-4xl hidden md:block">🐾 🐾</div>
            <div className="absolute top-0 left-4 opacity-10 text-4xl hidden md:block -scale-x-100">🐾 🐾</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Coluna Esquerda: Objetivo e Peças */}
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-black text-[#3a2218] uppercase tracking-wide mb-2 flex items-center gap-3">
                <span className="bg-[#c49a6c] text-[#3a2218] border-4 border-[#3a2218] w-10 h-10 flex items-center justify-center rounded-full text-xl shadow-[4px_4px_0px_#3a2218]">1</span> 
                A Batalha Assimétrica
              </h2>

              <section className="bg-[#e8dcc4] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#3a2218]">
                <h3 className="text-xl font-black mb-3 text-[#3a2218] uppercase">Objetivos Diferentes</h3>
                
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3 bg-[#fdf8ef] border-2 border-[#3a2218] p-3 rounded-lg shadow-[2px_2px_0px_#3a2218]">
                    <div className="w-10 h-10 rounded-full bg-[#f0c33c] border-[3px] border-[#3a2218] flex items-center justify-center text-xl shrink-0">🐆</div>
                    <div>
                      <h4 className="font-black text-[#3a2218] uppercase">A Onça Vence Se:</h4>
                      <p className="text-sm font-bold text-[#3a2218]/80">Capturar (comer) <strong className="text-[#e11d48]">5 Cães</strong>. Com apenas 9 cães no tabuleiro, fica impossível para a matilha encurralá-la.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-[#fdf8ef] border-2 border-[#3a2218] p-3 rounded-lg shadow-[2px_2px_0px_#3a2218]">
                    <div className="w-10 h-10 rounded-full bg-[#7d7d7d] border-[3px] border-[#3a2218] flex items-center justify-center text-xl shrink-0">🐺</div>
                    <div>
                      <h4 className="font-black text-[#3a2218] uppercase">Os Cães Vencem Se:</h4>
                      <p className="text-sm font-bold text-[#3a2218]/80">Encurralarem a Onça. Se chegar a vez da Onça e ela não tiver <strong className="text-[#4a8b54]">nenhum movimento legal</strong> (presa), a matilha ganha.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-[#e8dcc4] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#3a2218]">
                <h3 className="text-xl font-black mb-3 text-[#3a2218] uppercase">Movimentação</h3>
                <p className="text-sm font-bold text-[#3a2218]/80">
                  As peças andam pelos cruzamentos, os pontos. Tanto a Onça quanto os Cães andam exatamente 1 ponto por vez, seguindo as linhas desenhadas (verticais, horizontais ou diagonais).
                </p>
              </section>
            </div>

            {/* Coluna Direita: O Pulo da Onça e Dicas */}
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-black text-[#3a2218] uppercase tracking-wide mb-2 flex items-center gap-3">
                <span className="bg-[#c49a6c] text-[#3a2218] border-4 border-[#3a2218] w-10 h-10 flex items-center justify-center rounded-full text-xl shadow-[4px_4px_0px_#3a2218]">2</span> 
                O Bote da Onça
              </h2>

              <section className="bg-[#c49a6c] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#3a2218]">
                <h3 className="text-xl font-black mb-2 text-[#3a2218] uppercase">A Captura</h3>
                <p className="text-sm font-bold text-[#3a2218]/90 mb-3">
                  Somente a Onça pode capturar e ela ataca exatamente como nas Damas:
                </p>
                <ul className="list-disc list-outside ml-5 space-y-2 text-sm font-bold text-[#3a2218]/90">
                  <li>Se houver um cão no ponto do lado dela e o ponto logo atrás dele (na mesma linha) estiver vazio, a Onça pula sobre o cão e o captura.</li>
                  <li>A captura não é obrigatória.</li>
                  <li>Onça captura apenas 1 cão por turno.</li>
                </ul>
              </section>

              <h2 className="text-2xl font-black text-[#3a2218] uppercase tracking-wide mb-2 mt-2 flex items-center gap-3">
                <span className="bg-[#c49a6c] text-[#3a2218] border-4 border-[#3a2218] w-10 h-10 flex items-center justify-center rounded-full text-xl shadow-[4px_4px_0px_#3a2218]">3</span> 
                Estratégia de Caça
              </h2>

              <section className="bg-[#3a2218] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#c49a6c]">
                <h3 className="text-xl font-black mb-3 text-[#fdf8ef] uppercase">Como Vencer</h3>
                
                <div className="flex flex-col gap-3">
                  <div className="bg-[#fdf8ef]/10 p-3 rounded-lg border border-[#c49a6c]/30">
                    <p className="text-xs font-black text-[#c49a6c] uppercase tracking-widest mb-1">Para a Onça:</p>
                    <p className="text-sm font-bold text-[#fdf8ef]/80">Não se deixe encurralar! Fique no dançando pelo quadrado, não tenha medo de ficar perto dos cães.</p>
                  </div>
                  
                  <div className="bg-[#fdf8ef]/10 p-3 rounded-lg border border-[#c49a6c]/30">
                    <p className="text-xs font-black text-[#c49a6c] uppercase tracking-widest mb-1">Para os Cães:</p>
                    <p className="text-sm font-bold text-[#fdf8ef]/80">A paciência é seu maior segredo, calcule bem seus passos e avance devagar.</p>
                  </div>
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
      <div className="min-h-screen text-[#3a2218] p-4 md:p-8 relative flex justify-center font-sans overflow-x-hidden">
        <VintageBackground />
        
        <div className="w-full max-w-6xl z-10 bg-[#fdf8ef] rounded-2xl border-8 border-[#3a2218] shadow-[16px_16px_0px_#3a2218] flex flex-col p-6 md:p-10 h-fit my-auto relative mt-16 md:mt-auto mb-8">
          
          <Link 
            href={`/?open=${id}`} 
            className="absolute -top-6 -right-6 bg-[#e11d48] text-white w-14 h-14 flex items-center justify-center rounded-full font-black shadow-[6px_6px_0px_#3a2218] hover:scale-110 active:scale-95 transition-all border-4 border-[#3a2218] text-2xl z-50"
            title="Fechar Manual"
          >
            X
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Coluna Esquerda: Básico e Todas as Peças */}
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-black text-[#3a2218] uppercase tracking-wide mb-2 flex items-center gap-3">
                <span className="bg-[#c49a6c] text-[#3a2218] border-4 border-[#3a2218] w-10 h-10 flex items-center justify-center rounded-full text-xl shadow-[4px_4px_0px_#3a2218]">1</span> 
                Como Jogar
              </h2>

              <section className="bg-[#e8dcc4] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#3a2218]">
                <h3 className="text-xl font-black mb-2 text-[#3a2218] uppercase">Objetivo</h3>
                <p className="text-sm font-bold mb-2 text-[#3a2218]/80">
                  O objetivo é dar <strong>Xeque-Mate</strong> no Rei adversário — colocá-lo em uma posição de ataque sem escapatória.
                </p>
              </section>

              <section className="bg-[#e8dcc4] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#3a2218]">
                <h3 className="text-xl font-black mb-3 text-[#3a2218] uppercase">As Peças</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-[#fdf8ef] border-2 border-[#3a2218] p-3 rounded-lg shadow-[2px_2px_0px_#3a2218]">
                    <span className="text-4xl leading-none">♙</span>
                    <div>
                      <h4 className="font-black text-[#3a2218] uppercase">Peão</h4>
                      <p className="text-xs font-bold text-[#3a2218]/70">Anda 1 (ou 2 no início). Captura na diagonal.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-[#fdf8ef] border-2 border-[#3a2218] p-3 rounded-lg shadow-[2px_2px_0px_#3a2218]">
                    <span className="text-4xl leading-none">♘</span>
                    <div>
                      <h4 className="font-black text-[#3a2218] uppercase">Cavalo</h4>
                      <p className="text-xs font-bold text-[#3a2218]/70">Anda em "L" (2x1). Única peça que pula.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-[#fdf8ef] border-2 border-[#3a2218] p-3 rounded-lg shadow-[2px_2px_0px_#3a2218]">
                    <span className="text-4xl leading-none">♗</span>
                    <div>
                      <h4 className="font-black text-[#3a2218] uppercase">Bispo</h4>
                      <p className="text-xs font-bold text-[#3a2218]/70">Anda apenas nas diagonais.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-[#fdf8ef] border-2 border-[#3a2218] p-3 rounded-lg shadow-[2px_2px_0px_#3a2218]">
                    <span className="text-4xl leading-none">♖</span>
                    <div>
                      <h4 className="font-black text-[#3a2218] uppercase">Torre</h4>
                      <p className="text-xs font-bold text-[#3a2218]/70">Anda em linhas retas (frente/lado).</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-[#fdf8ef] border-2 border-[#3a2218] p-3 rounded-lg shadow-[2px_2px_0px_#3a2218]">
                    <span className="text-4xl leading-none">♕</span>
                    <div>
                      <h4 className="font-black text-[#3a2218] uppercase">Dama</h4>
                      <p className="text-xs font-bold text-[#3a2218]/70">Retas e diagonais, livre.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-[#fdf8ef] border-2 border-[#3a2218] p-3 rounded-lg shadow-[2px_2px_0px_#3a2218]">
                    <span className="text-4xl leading-none text-red-600">♔</span>
                    <div>
                      <h4 className="font-black text-[#e11d48] uppercase">Rei</h4>
                      <p className="text-xs font-bold text-[#3a2218]/70">Anda 1 casa para qualquer lado. Não pode entrar em xeque.</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Coluna Direita: Regras Especiais e Fim */}
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-black text-[#3a2218] uppercase tracking-wide mb-2 flex items-center gap-3">
                <span className="bg-[#c49a6c] text-[#3a2218] border-4 border-[#3a2218] w-10 h-10 flex items-center justify-center rounded-full text-xl shadow-[4px_4px_0px_#3a2218]">2</span> 
                Mov. Especiais
              </h2>

              <section className="bg-[#c49a6c] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#3a2218] flex flex-col gap-3">
                <div>
                  <h3 className="text-base font-black text-[#3a2218] uppercase">Roque</h3>
                  <p className="text-xs font-bold text-[#3a2218]/90">O Rei anda 2 casas para a Torre, e a Torre pula para o outro lado. Exige que nenhum dos dois tenha se movido.</p>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#3a2218] uppercase">En Passant</h3>
                  <p className="text-xs font-bold text-[#3a2218]/90">Se um peão inimigo andar 2 casas e parar ao lado do seu, você pode capturá-lo na diagonal como se ele tivesse andado só 1 casa.</p>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#3a2218] uppercase">Promoção</h3>
                  <p className="text-xs font-bold text-[#3a2218]/90">Peão na última fileira vira Dama, Torre, Bispo ou Cavalo.</p>
                </div>
              </section>

              <h2 className="text-2xl font-black text-[#3a2218] uppercase tracking-wide mb-2 mt-2 flex items-center gap-3">
                <span className="bg-[#c49a6c] text-[#3a2218] border-4 border-[#3a2218] w-10 h-10 flex items-center justify-center rounded-full text-xl shadow-[4px_4px_0px_#3a2218]">3</span> 
                Fim de Jogo
              </h2>

              <section className="bg-[#3a2218] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#c49a6c]">
                <h3 className="text-xl font-black mb-2 text-[#fdf8ef] uppercase">Xeque-Mate (Vitória)</h3>
                <p className="text-sm font-bold text-[#fdf8ef]/80">
                  O Rei está em xeque (sendo atacado) e não tem como fugir, bloquear, ou capturar a peça atacante.
                </p>
              </section>

              <section className="bg-[#e8dcc4] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#3a2218] flex flex-col gap-3">
                <h3 className="text-xl font-black text-[#3a2218] uppercase border-b-2 border-[#3a2218]/20 pb-2">Empates</h3>
                
                <div>
                  <h4 className="text-sm font-black text-[#3a2218] uppercase">Rei Afogado (Stalemate)</h4>
                  <p className="text-xs font-bold text-[#3a2218]/80">O Rei NÃO está em xeque, mas você não tem nenhum movimento válido disponível.</p>
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#3a2218] uppercase">Material Insuficiente</h4>
                  <p className="text-xs font-bold text-[#3a2218]/80">Não há peças suficientes para dar mate (ex: Rei e Bispo vs Rei).</p>
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#3a2218] uppercase">Repetição de Posição</h4>
                  <p className="text-xs font-bold text-[#3a2218]/80">A exata mesma posição do tabuleiro se repete 3 vezes.</p>
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#3a2218] uppercase">Regra dos 50 Movimentos</h4>
                  <p className="text-xs font-bold text-[#3a2218]/80">50 lances seguidos sem captura e sem mover nenhum peão.</p>
                </div>
              </section>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (id === 'surakarta') {
    return (
      <div className="min-h-screen text-[#3a2218] p-4 md:p-8 relative flex justify-center font-sans overflow-x-hidden">
        <VintageBackground />
        
        <div className="w-full max-w-6xl z-10 bg-[#fdf8ef] rounded-2xl border-8 border-[#3a2218] shadow-[16px_16px_0px_#3a2218] flex flex-col p-6 md:p-10 h-fit my-auto relative mt-16 md:mt-auto mb-8">
          
          <Link 
            href={`/?open=${id}`} 
            className="absolute -top-6 -right-6 bg-[#e11d48] text-white w-14 h-14 flex items-center justify-center rounded-full font-black shadow-[6px_6px_0px_#3a2218] hover:scale-110 active:scale-95 transition-all border-4 border-[#3a2218] text-2xl z-50"
            title="Fechar Manual"
          >
            X
          </Link>

          <div className="text-center mb-8 border-b-4 border-[#3a2218] pb-6 relative">
            <h1 className="text-4xl md:text-6xl font-black uppercase text-[#3a2218] tracking-widest drop-shadow-[3px_3px_0px_#c49a6c]">
              Surakarta
            </h1>
            <p className="text-lg text-[#3a2218]/80 mt-2 font-black uppercase tracking-widest">
              O Combate das Espirais
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-black text-[#3a2218] uppercase tracking-wide mb-2 flex items-center gap-3">
                <span className="bg-[#c49a6c] text-[#3a2218] border-4 border-[#3a2218] w-10 h-10 flex items-center justify-center rounded-full text-xl shadow-[4px_4px_0px_#3a2218]">1</span> 
                Como Jogar
              </h2>

              <section className="bg-[#e8dcc4] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#3a2218]">
                <h3 className="text-xl font-black mb-2 text-[#3a2218] uppercase">Objetivo</h3>
                <p className="text-sm font-bold mb-2 text-[#3a2218]/80">
                  Capture todas as peças do oponente em um tabuleiro único onde as pontas possuem curvas espirais.
                </p>
              </section>

              <section className="bg-[#e8dcc4] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#3a2218]">
                <h3 className="text-xl font-black mb-3 text-[#3a2218] uppercase">Movimentação</h3>
                <p className="text-sm font-bold mb-2 text-[#3a2218]/80">As peças se movem ortogonalmente ou diagonalmente para uma intersecção adjacente livre, como o Rei do Xadrez.</p>
              </section>
            </div>

            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-black text-[#3a2218] uppercase tracking-wide mb-2 flex items-center gap-3">
                <span className="bg-[#c49a6c] text-[#3a2218] border-4 border-[#3a2218] w-10 h-10 flex items-center justify-center rounded-full text-xl shadow-[4px_4px_0px_#3a2218]">2</span> 
                A Captura em Espiral
              </h2>

              <section className="bg-[#c49a6c] p-5 rounded-xl border-4 border-[#3a2218] shadow-[6px_6px_0px_#3a2218]">
                <h3 className="text-xl font-black mb-2 text-[#3a2218] uppercase">O Diferencial</h3>
                <p className="text-sm font-bold text-[#3a2218]/90 mb-3">
                  A captura só pode ser feita se a peça que ataca viajar por pelo menos uma das curvas externas (os loops nos cantos do tabuleiro) no seu caminho em direção à peça alvo!
                </p>
                <p className="text-sm font-bold text-[#3a2218]/90">
                  Nenhuma captura é obrigatória.
                </p>
              </section>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf8ef] flex items-center justify-center">
      <h1 className="text-3xl font-black text-[#3a2218] uppercase">Manual não encontrado!</h1>
      <Link href="/" className="ml-4 font-bold underline text-[#4a8b54]">Voltar</Link>
    </div>
  );
}
