import React, { Suspense } from 'react';
import AdugoBoard from '@/components/AdugoBoard';

export default function AdugoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#e8dcc4]"></div>}>
      <AdugoBoard />
    </Suspense>
  );
}
