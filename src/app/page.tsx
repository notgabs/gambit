import { Suspense } from 'react';
import VintageLobby from '@/components/VintageLobby';

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div className="min-h-screen bg-[#e8dcc4]"></div>}>
        <VintageLobby />
      </Suspense>
    </main>
  );
}
