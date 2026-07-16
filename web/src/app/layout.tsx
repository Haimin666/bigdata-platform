import type { ReactNode } from 'react';
import './globals.css';
import { QueryProvider } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';

const setThemeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: setThemeScript }} />
      </head>
      <body className="font-sans">
        <div className="relative z-10 min-h-screen">
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </div>
      </body>
    </html>
  );
}
