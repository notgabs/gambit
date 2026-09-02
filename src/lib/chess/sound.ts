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
