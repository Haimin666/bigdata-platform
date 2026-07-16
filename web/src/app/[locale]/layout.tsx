import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import zhCN from '../../../messages/zh-CN.json';
import en from '../../../messages/en.json';
import type { ReactNode } from 'react';

const messages = { 'zh-CN': zhCN, en } as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale as 'zh-CN' | 'en']}>
      {children}
    </NextIntlClientProvider>
  );
}
