'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProject, type CreateProjectInput } from './api';
import { X, Loader2 } from 'lucide-react';

export function CreateProjectDialog({
  workspaceId,
  onClose,
}: {
  workspaceId: number;
  onClose: () => void;
}) {
  const t = useTranslations('project');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [business, setBusiness] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', workspaceId] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const submit = () => {
    setError(null);
    if (!name.trim()) {
      setError(t('namePlaceholder'));
      return;
    }
    mutation.mutate({ name, description, business, workspaceId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="w-full max-w-md overflow-hidden rounded-[calc(var(--radius)+4px)] border border-[var(--border)] bg-[var(--card)] shadow-2xl" style={{ animation: 'fadeUp 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <p className="mono-label">// new</p>
            <h3 className="mt-1 text-lg font-semibold">{t('createTitle')}</h3>
          </div>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="pj-name" className="mono-label">{tc('name')}</Label>
            <Input id="pj-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pj-desc" className="mono-label">{tc('description')}</Label>
            <Input id="pj-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('descPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pj-biz" className="mono-label">{t('businessLabel')}</Label>
            <Input id="pj-biz" value={business} onChange={(e) => setBusiness(e.target.value)} />
          </div>
          {error && <p className="mono text-xs text-red-400">! {error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
          <Button variant="outline" onClick={onClose}>{tc('cancel')}</Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
            {tc('confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
