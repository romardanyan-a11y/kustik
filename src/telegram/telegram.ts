// Интеграция с Telegram Mini Apps (Web App SDK).
// Работает только в вебе внутри Telegram; в остальных случаях — no-op.
import { Platform } from 'react-native';

const SDK_URL = 'https://telegram.org/js/telegram-web-app.js';

// Минимальный интерфейс того, что мы используем.
export interface TgWebApp {
  ready: () => void;
  expand: () => void;
  initData?: string;
  initDataUnsafe?: { start_param?: string; user?: { id: number; first_name: string } };
  openTelegramLink?: (url: string) => void;
  openInvoice?: (url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void;
  version?: string;
  isVersionAtLeast?: (v: string) => boolean;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  };
  CloudStorage?: {
    setItem: (key: string, value: string, cb?: (err: unknown, ok?: boolean) => void) => void;
    getItem: (key: string, cb: (err: unknown, value?: string) => void) => void;
    getItems: (keys: string[], cb: (err: unknown, values?: Record<string, string>) => void) => void;
    removeItems: (keys: string[], cb?: (err: unknown, ok?: boolean) => void) => void;
  };
  colorScheme?: 'light' | 'dark';
}

function getWA(): TgWebApp | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp ?? null;
}

// Загружает SDK (если ещё не подключён) и возвращает WebApp или null.
export function loadTelegramSdk(): Promise<TgWebApp | null> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return Promise.resolve(null);
  const existing = getWA();
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve) => {
    const prev = document.querySelector('script[data-telegram-sdk]');
    if (prev) {
      prev.addEventListener('load', () => resolve(getWA()));
      // Возможно, уже загружен между проверками.
      setTimeout(() => resolve(getWA()), 0);
      return;
    }
    const s = document.createElement('script');
    s.src = SDK_URL;
    s.async = true;
    s.setAttribute('data-telegram-sdk', '1');
    s.onload = () => resolve(getWA());
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

// Инициализация при старте: ready + разворот на весь экран + цвета «Кустика».
export async function initTelegram(): Promise<TgWebApp | null> {
  const wa = await loadTelegramSdk();
  if (!wa) return null;
  try {
    wa.ready();
    wa.expand();
    wa.disableVerticalSwipes?.(); // чтобы свайп вниз не закрывал мини-апп во время скролла
    wa.setHeaderColor?.('#F8EFE0');
    wa.setBackgroundColor?.('#F2E7D3');
  } catch {
    // молча — вне Telegram методов может не быть
  }
  return wa;
}

// Управление системной кнопкой «Назад» Telegram.
export function setTelegramBackButton(visible: boolean, onPress: () => void): () => void {
  const wa = getWA();
  const bb = wa?.BackButton;
  if (!bb) return () => {};
  if (visible) {
    bb.onClick(onPress);
    bb.show();
    return () => {
      bb.offClick(onPress);
      bb.hide();
    };
  }
  bb.hide();
  return () => {};
}

export function telegramHaptic(kind: 'light' | 'success' = 'light') {
  const wa = getWA();
  if (!wa?.HapticFeedback) return;
  try {
    if (kind === 'success') wa.HapticFeedback.notificationOccurred('success');
    else wa.HapticFeedback.impactOccurred('light');
  } catch {
    /* no-op */
  }
}

export function isInTelegram(): boolean {
  return getWA() != null;
}

// Сырая строка initData — подпись для серверных запросов.
export function getInitData(): string {
  return getWA()?.initData || '';
}

// startapp-параметр диплинка (t.me/bot?startapp=...).
export function getStartParam(): string | null {
  return getWA()?.initDataUnsafe?.start_param || null;
}

// Открыть счёт Telegram Stars; колбэк получает статус оплаты.
export function openInvoice(url: string, cb: (status: string) => void): boolean {
  const wa = getWA();
  if (wa?.openInvoice) {
    wa.openInvoice(url, cb as (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void);
    return true;
  }
  return false;
}

// Открыть t.me-ссылку (шеринг приглашения).
export function openTelegramLink(url: string): boolean {
  const wa = getWA();
  if (wa?.openTelegramLink) {
    wa.openTelegramLink(url);
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// CloudStorage: облачное хранилище Telegram (переживает смену устройства).
// Ограничение: 4096 символов на ключ → большой JSON пилим на чанки.
// Схема ключей: k_meta = число чанков, k_0..k_N = куски строки.
// ---------------------------------------------------------------------------

const CHUNK = 3800; // запас от лимита 4096

// Старые клиенты Telegram не отвечают на CloudStorage-запросы (колбэк не
// зовётся вообще) — поэтому: (1) версия ≥ 6.9, (2) таймаут на каждую операцию.
function cloud(): NonNullable<TgWebApp['CloudStorage']> | null {
  const wa = getWA();
  if (!wa?.CloudStorage) return null;
  try {
    if (wa.isVersionAtLeast && !wa.isVersionAtLeast('6.9')) return null;
  } catch {
    return null;
  }
  return wa.CloudStorage;
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);
}

export function hasCloudStorage(): boolean {
  return cloud() != null;
}

export function cloudSave(key: string, json: string): Promise<boolean> {
  const cs = cloud();
  if (!cs) return Promise.resolve(false);
  const chunks: string[] = [];
  for (let i = 0; i < json.length; i += CHUNK) chunks.push(json.slice(i, i + CHUNK));
  const op = new Promise<boolean>((resolve) => {
    try {
      let pending = chunks.length + 1;
      let failed = false;
      const done = (err: unknown) => {
        if (err) failed = true;
        if (--pending === 0) resolve(!failed);
      };
      cs.setItem(`${key}_meta`, String(chunks.length), done);
      chunks.forEach((c, i) => cs.setItem(`${key}_${i}`, c, done));
    } catch {
      resolve(false);
    }
  });
  return withTimeout(op, 4000, false);
}

export function cloudLoad(key: string): Promise<string | null> {
  const cs = cloud();
  if (!cs) return Promise.resolve(null);
  const op = new Promise<string | null>((resolve) => {
    try {
      cs.getItem(`${key}_meta`, (err, metaVal) => {
        if (err || !metaVal) return resolve(null);
        const n = parseInt(metaVal, 10);
        if (!Number.isFinite(n) || n <= 0) return resolve(null);
        const keys = Array.from({ length: n }, (_, i) => `${key}_${i}`);
        cs.getItems(keys, (err2, values) => {
          if (err2 || !values) return resolve(null);
          let out = '';
          for (let i = 0; i < n; i++) {
            const part = values[`${key}_${i}`];
            if (part == null) return resolve(null); // неполный сейв — не доверяем
            out += part;
          }
          resolve(out);
        });
      });
    } catch {
      resolve(null);
    }
  });
  // Клиент не ответил за 2.5с — работаем с локальным сейвом.
  return withTimeout(op, 2500, null);
}
