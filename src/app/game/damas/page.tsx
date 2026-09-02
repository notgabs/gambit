'use client';
import { useSearchParams } from 'next/navigation';
import CheckersBoard from '@/components/CheckersBoard';
import PracaBoard from '@/components/themes/PracaBoard';
import { Suspense } from 'react';

function DamasController() {
  const searchParams = useSearchParams();
  const theme = searchParams.get('theme');

  if (theme === 'praca') {
    return <PracaBoard />;
  }

  return <CheckersBoard />;
}

export default function DamasPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#9ce5e5]" />}>
      <DamasController />
    </Suspense>
  );
}
