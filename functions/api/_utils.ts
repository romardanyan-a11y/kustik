// Общие утилиты Pages Functions: валидация Telegram initData, ответы, типы.

export interface Env {
  KV: KVNamespace;
  BOT_TOKEN: string;
  CRON_SECRET: string;
  // Необязательный отдельный секрет для secret_token вебхука.
  // Если не задан — используется CRON_SECRET (обратная совместимость).
  WEBHOOK_SECRET?: string;
}

// Секрет, которым подписан вебхук Telegram (header x-telegram-bot-api-secret-token).
export const webhookSecret = (env: Env): string => env.WEBHOOK_SECRET || env.CRON_SECRET;

// Сравнение строк за постоянное время (защита от timing-атак на подпись).
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Минимальные типы Cloudflare KV (без @cloudflare/workers-types,
// чтобы не тащить их в tsconfig приложения).
export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(opts?: { prefix?: string; cursor?: string }): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

export interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

export interface TgUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export const err = (message: string, status = 400) => json({ ok: false, error: message }, status);

// --- Валидация initData Telegram Mini Apps (HMAC-SHA256, Web Crypto) ---
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
const enc = new TextEncoder();

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Возвращает пользователя из initData или null, если подпись неверна/протухла.
export async function validateInitData(initData: string, botToken: string): Promise<TgUser | null> {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');
    const dataCheck = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');
    const secret = await hmacSha256(enc.encode('WebAppData'), botToken);
    const calc = hex(await hmacSha256(secret, dataCheck));
    if (!timingSafeEqual(calc, hash)) return null;
    // Свежесть: не старше 24 часов.
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    if (!authDate || Date.now() / 1000 - authDate > 86400) return null;
    const userRaw = params.get('user');
    if (!userRaw) return null;
    return JSON.parse(userRaw) as TgUser;
  } catch {
    return null;
  }
}

// --- Telegram Bot API ---
export async function tg(botToken: string, method: string, payload: unknown): Promise<unknown> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// --- Общий дом ---
export interface HomeMemberDoc {
  id: string; // 'tg<userId>'
  tgId: number;
  name: string;
  emoji: string;
  color: string;
}

export interface HomeDoc {
  rev: number;
  updatedAt: number;
  members: HomeMemberDoc[];
  state: Record<string, unknown> | null; // общий кусок PersistentState
}

export const MEMBER_EMOJI = ['🧑', '👩', '🧔', '👧', '👦', '🧓', '👵', '🧑‍🦱'];
export const MEMBER_COLORS = ['#C56A4B', '#5E9C92', '#6E9C63', '#C99A5C', '#9B7FB0', '#B98A5E'];

export function newHomeId(): string {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  const rnd = crypto.getRandomValues(new Uint8Array(10));
  for (let i = 0; i < 10; i++) s += abc[rnd[i] % abc.length];
  return s;
}

export async function getHome(kv: KVNamespace, id: string): Promise<HomeDoc | null> {
  const raw = await kv.get(`home:${id}`);
  return raw ? (JSON.parse(raw) as HomeDoc) : null;
}

export async function putHome(kv: KVNamespace, id: string, doc: HomeDoc): Promise<void> {
  await kv.put(`home:${id}`, JSON.stringify(doc));
}

export function memberFor(user: TgUser, existing: HomeMemberDoc[]): HomeMemberDoc {
  const i = existing.length;
  return {
    id: `tg${user.id}`,
    tgId: user.id,
    name: user.first_name.slice(0, 20) || 'Без имени',
    emoji: MEMBER_EMOJI[i % MEMBER_EMOJI.length],
    color: MEMBER_COLORS[i % MEMBER_COLORS.length],
  };
}
