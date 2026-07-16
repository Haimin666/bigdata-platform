import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import zhCN from '../../messages/zh-CN.json';
import en from '../../messages/en.json';

const messages = {
  'zh-CN': zhCN,
  en,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  const locales = routing.locales as readonly string[];
  if (!locale || !locales.includes(locale)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: messages[locale as 'zh-CN' | 'en'],
  };
});
