'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { logout, getBaseInfo } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { ChevronDown, LogOut, CircleUser } from 'lucide-react';

export function UserMenu() {
  const t = useTranslations('common');
  const router = useRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    setUsername(getBaseInfo()?.username ?? '');
  }, []);

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Dropdown
      trigger={
        <span className="group flex items-center gap-2 rounded-[var(--radius)] px-2.5 py-1.5 text-sm hover:bg-[var(--surface-2)]">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-[var(--border)] bg-[var(--background)]/40 text-[var(--primary)]">
            <CircleUser size={15} />
          </span>
          <span className="mono max-w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-xs">
            {username || '—'}
          </span>
          <ChevronDown size={14} className="text-[var(--muted-foreground)]" />
        </span>
      }
    >
      {(close) => (
        <DropdownItem
          onClick={async () => {
            close();
            await onLogout();
          }}
        >
          <LogOut size={15} /> <span className="text-sm">{t('logout')}</span>
        </DropdownItem>
      )}
    </Dropdown>
  );
}
