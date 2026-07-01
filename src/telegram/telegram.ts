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
