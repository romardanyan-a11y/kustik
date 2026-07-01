// Интеграция с Telegram Mini Apps (Web App SDK).
// Работает только в вебе внутри Telegram; в остальных случаях — no-op.
import { Platform } from 'react-native';

const SDK_URL = 'https://telegram.org/js/telegram-web-app.js';

// Минимальный интерфейс того, что мы используем.
export interface TgWebApp {
  ready: () => void;
  expand: () => void;
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

// ---------------------------------------------------------------------------
// CloudStorage: облачное хранилище Telegram (переживает смену устройства).
// Ограничение: 4096 символов на ключ → большой JSON пилим на чанки.
// Схема ключей: k_meta = число чанков, k_0..k_N = куски строки.
// ---------------------------------------------------------------------------

const CHUNK = 3800; // запас от лимита 4096

function cloud(): NonNullable<TgWebApp['CloudStorage']> | null {
  return getWA()?.CloudStorage ?? null;
}

export function hasCloudStorage(): boolean {
  return cloud() != null;
}

export function cloudSave(key: string, json: string): Promise<boolean> {
  const cs = cloud();
  if (!cs) return Promise.resolve(false);
  const chunks: string[] = [];
  for (let i = 0; i < json.length; i += CHUNK) chunks.push(json.slice(i, i + CHUNK));
  return new Promise((resolve) => {
    let pending = chunks.length + 1;
    let failed = false;
    const done = (err: unknown) => {
      if (err) failed = true;
      if (--pending === 0) resolve(!failed);
    };
    cs.setItem(`${key}_meta`, String(chunks.length), done);
    chunks.forEach((c, i) => cs.setItem(`${key}_${i}`, c, done));
  });
}

export function cloudLoad(key: string): Promise<string | null> {
  const cs = cloud();
  if (!cs) return Promise.resolve(null);
  return new Promise((resolve) => {
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
  });
}
