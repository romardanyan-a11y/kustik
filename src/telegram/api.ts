// Клиент API общего дома и напоминаний (Pages Functions, same-origin /api).
// Все запросы подписаны initData; вне Telegram — тихо не работают.
import type { Member, PersistentState } from '../data/types';
import { getInitData } from './telegram';

export interface HomeMemberDoc extends Member {
  tgId?: number;
}

export interface HomeSnapshot {
  homeId: string;
  member: HomeMemberDoc; // я в этом доме
  members: HomeMemberDoc[];
  state: Partial<PersistentState> | null;
  rev: number;
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  const initData = getInitData();
  if (!initData) return null; // вне Telegram
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...body, initData }),
    });
    const data = (await res.json()) as T & { conflict?: boolean };
    if (!res.ok && !(res.status === 409 && data && data.conflict)) return null;
    return data;
  } catch {
    return null;
  }
}

export function apiReminder(on: boolean, hour: number): Promise<unknown> {
  return post('/api/reminder', { on, hour, tzMin: -new Date().getTimezoneOffset() });
}

export function apiHomeCreate(state: Record<string, unknown>): Promise<HomeSnapshot | null> {
  return post<HomeSnapshot>('/api/home/create', { state });
}

export function apiHomeJoin(homeId: string): Promise<HomeSnapshot | null> {
  return post<HomeSnapshot>('/api/home/join', { homeId });
}

export interface SyncResult {
  ok: boolean;
  conflict?: boolean;
  rev: number;
  state: Partial<PersistentState> | null;
  members?: HomeMemberDoc[];
}

export function apiHomeSync(homeId: string, baseRev: number, state?: Record<string, unknown>): Promise<SyncResult | null> {
  return post<SyncResult>('/api/home/sync', state ? { homeId, baseRev, state } : { homeId });
}

// --- Telegram Stars ---
export function apiStarsInvoice(itemId: string): Promise<{ ok: boolean; link?: string; alreadyOwned?: boolean } | null> {
  return post('/api/stars/invoice', { itemId });
}

export function apiStarsClaim(): Promise<{ ok: boolean; items: string[] } | null> {
  return post('/api/stars/claim', {});
}
