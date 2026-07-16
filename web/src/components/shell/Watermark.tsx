'use client';

import { getBaseInfo } from '@/lib/auth';
import { useEffect, useState } from 'react';

function formatNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function Watermark({ show }: { show: boolean }) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!show) return;
    const info = getBaseInfo();
    const tick = () => setText(`${info?.username ?? ''} ${formatNow()}`);
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [show]);

  if (!show || !text) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.06]"
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='140'><text x='10' y='70' font-size='16' fill='#000'>${text}</text></svg>`,
        )}")`,
        backgroundRepeat: 'repeat',
      }}
    />
  );
}
