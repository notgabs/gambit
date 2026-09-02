import React, { Suspense } from 'react';
import SurakartaBoard from '@/components/SurakartaBoard';

export default function SurakartaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#e8dcc4]"></div>}>
      <SurakartaBoard />
    </Suspense>
  );
}
