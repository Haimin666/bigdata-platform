'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from '@/i18n/routing';
import { getBaseInfo } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getBaseInfo()) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="grid h-screen place-items-center">
        <Loader2 className="animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }
  return <>{children}</>;
}
