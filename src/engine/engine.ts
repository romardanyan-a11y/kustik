// Движок «Кустик» — чистые функции. Точный порт логики прототипа.
// Время моделируется через dayOffset (в проде — реальные даты).
import type { LogEntry, Member, PersistentState, Room, Task } from '../data/types';

// --- Утилиты ---
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// smoothstep
export const ss = (x: number) => {
  x = clamp01(x);
  return x * x * (3 - 2 * x);
};

export function hexToRgb(h: string): [number, number, number] {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function lerpColor(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  t = clamp01(t);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(
    A[2] + (B[2] - A[2]) * t
  )})`;
}

// Русская плюрализация: f = [одна, две-четыре, много]
export function plural(n: number, f: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return f[2];
  if (b > 1 && b < 5) return f[1];
  if (b === 1) return f[0];
  return f[2];
}

// --- Ядро движка ---
export const daysSince = (t: Task, dayOffset: number) => dayOffset - t.lastDay;
export const maturity = (t: Task, dayOffset: number) => daysSince(t, dayOffset) / t.freq;
export const freshness = (t: Task, dayOffset: number) => clamp01(1 - maturity(t, dayOffset) / 2);

export function overallClean(tasks: Task[], dayOffset: number): number {
  if (!tasks.length) return 100;
  return (tasks.reduce((a, t) => a + freshness(t, dayOffset), 0) / tasks.length) * 100;
}

export function roomClean(tasks: Task[], roomId: string, dayOffset: number): number {
  const ts = tasks.filter((t) => t.roomId === roomId);
  if (!ts.length) return 100;
  return (ts.reduce((a, t) => a + freshness(t, dayOffset), 0) / ts.length) * 100;
}

// «Пора сегодня» — maturity >= 1, самое запущенное сверху.
export function computeDue(tasks: Task[], dayOffset: number): Task[] {
  return tasks
    .filter((t) => maturity(t, dayOffset) >= 1)
    .sort((a, b) => maturity(b, dayOffset) - maturity(a, dayOffset));
}

// «На подходе» — 0.55 <= maturity < 1, топ-3.
export function computeUpcoming(tasks: Task[], dayOffset: number): Task[] {
  return tasks
    .filter((t) => {
      const m = maturity(t, dayOffset);
      return m >= 0.55 && m < 1;
    })
    .sort((a, b) => maturity(b, dayOffset) - maturity(a, dayOffset))
    .slice(0, 3);
}

// Награда за дело.
export const reward = (t: Task, dayOffset: number) => Math.round(5 * Math.max(1, maturity(t, dayOffset)));

// --- Уровни ---
export interface LevelTier {
  max: number;
  name: string;
  idx: number;
  emoji: string;
  accessory: 'bud' | 'butterfly' | 'crown' | null;
}
export const LEVEL_TIERS: LevelTier[] = [
  { max: 6, name: 'Росток', idx: 0, emoji: '🌱', accessory: null },
  { max: 14, name: 'Кустик', idx: 1, emoji: '🪴', accessory: null },
  { max: 26, name: 'Цветик', idx: 2, emoji: '🌿', accessory: 'bud' },
  { max: 45, name: 'Пышный куст', idx: 3, emoji: '🌸', accessory: 'butterfly' },
  { max: Infinity, name: 'Легенда сада', idx: 4, emoji: '👑', accessory: 'crown' },
];
export const levelOf = (n: number): LevelTier => LEVEL_TIERS.find((t) => n < t.max)!;

// --- Ротация ответственных ---
// С одним участником (общий дом до прихода партнёра) ротация не нужна.
export function assignee(t: Task, state: PersistentState): Member | null {
  const ms = state.members;
  if (ms.length < 2) return null;
  const n = ms.length;
  const k = ((((state.turns[t.id] || 0) % n) + n) % n);
  return ms[k];
}

// --- Подписи ---
export function freqLabel(f: number): string {
  const m: Record<number, string> = {
    1: 'каждый день',
    3: 'раз в 3 дня',
    7: 'раз в неделю',
    14: 'раз в 2 недели',
    30: 'раз в месяц',
  };
  return m[f] || `каждые ${f} ${plural(f, ['день', 'дня', 'дней'])}`;
}

export function lastLabel(t: Task, dayOffset: number): string {
  const d = daysSince(t, dayOffset);
  if (d <= 0) return 'сделано сегодня';
  if (d === 1) return 'вчера';
  return `${d} ${plural(d, ['день', 'дня', 'дней'])} назад`;
}

export function greetingInfo(): [string, string] {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return ['Доброе утро', '☀️'];
  if (h >= 12 && h < 18) return ['Добрый день', '🌤️'];
  if (h >= 18 && h < 23) return ['Добрый вечер', '🌙'];
  return ['Доброй ночи', '✨'];
}

export function quip(p: number): string {
  if (p < 25) return 'Кустик совсем загрустил — спаси его, начни с одного дела';
  if (p < 50) return 'Есть над чем поработать. Но мы не торопимся';
  if (p < 70) return 'Уже неплохо! Пара дел — и совсем красота';
  if (p < 88) return 'Почти блеск — кустик доволен';
  return 'Дом сияет, кустик цветёт!';
}

export function weatherFor(pct: number): string {
  return pct >= 80 ? '☀️' : pct >= 60 ? '🌤️' : pct >= 40 ? '⛅' : pct >= 20 ? '🌥️' : '🌧️';
}

export function isSleepy(): boolean {
  const h = new Date().getHours();
  return h >= 22 || h < 6;
}

export function dateLabel(): string {
  let dl = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  return dl.charAt(0).toUpperCase() + dl.slice(1);
}

// «через N дней» для карточек «на подходе».
export function upcomingWhen(t: Task, dayOffset: number): string {
  const du = Math.max(1, Math.ceil(t.freq - daysSince(t, dayOffset)));
  return du === 1 ? 'завтра' : `через ${du} ${plural(du, ['день', 'дня', 'дней'])}`;
}

// --- Экспресс «Гости на пороге»: топ-7 по «видимости» ---
export function expressVisibility(t: Task, dayOffset: number): number {
  const n = t.name.toLowerCase();
  let s = 0;
  if (/пол/.test(n)) s += 5;
  if (/мусор/.test(n)) s += 5;
  if (/посуд|раковин/.test(n)) s += 4;
  if (/поверхн|столешниц|плита/.test(n)) s += 4;
  if (/зеркал/.test(n)) s += 3;
  if (/разобрать|вещи|порядок/.test(n)) s += 4;
  if (/пыл/.test(n)) s += 2;
  return s + maturity(t, dayOffset) * 1.5;
}

export function computeExpress(tasks: Task[], dayOffset: number): Task[] {
  return tasks
    .slice()
    .map((t) => ({ t, sc: expressVisibility(t, dayOffset) }))
    .sort((a, b) => b.sc - a.sc)
    .slice(0, 7)
    .map((o) => o.t);
}

// --- Статус-цвета (точка / пилюля) ---
export const STATUS = {
  rust: '#BB4F32',
  terra: '#C56A4B',
  terraDk: '#A8543A',
  honey: '#DC9A52',
  sage: '#6E9C63',
};
export function statusDot(m: number): string {
  return m >= 1.25 ? STATUS.rust : m >= 1 ? STATUS.terra : m >= 0.6 ? STATUS.honey : STATUS.sage;
}

// --- Достижения ---
export interface AchievementDef {
  key: string;
  emoji: string;
  name: string;
  desc: string;
  unlocked: boolean;
}
// Условия достижений «истинны сейчас». Разблокировка навсегда фиксируется
// в state.achUnlocked (см. стор) — здесь только вычисление условий.
export function achievements(state: PersistentState): AchievementDef[] {
  const totalDone = state.totalDone;
  const lvl = levelOf(totalDone);
  const curClean = overallClean(state.tasks, state.dayOffset);
  const allClean = state.rooms.every((r) => roomClean(state.tasks, r.id, state.dayOffset) >= 70);
  return [
    { key: 'a1', emoji: '🔥', name: 'На волне', desc: 'Серия 3 дня', unlocked: state.streak >= 3 },
    { key: 'a2', emoji: '⚡', name: 'Неделя силы', desc: 'Серия 7 дней', unlocked: state.streak >= 7 },
    { key: 'a3', emoji: '🌿', name: 'Зелёные пальцы', desc: 'Кустик дорос до Цветика', unlocked: lvl.idx >= 2 },
    { key: 'a4', emoji: '👑', name: 'Магистр блеска', desc: 'Кустик — Легенда сада', unlocked: lvl.idx >= 4 },
    { key: 'a5', emoji: '✨', name: 'Дом сиял', desc: 'Чистота 85% и выше', unlocked: Math.max(state.bestClean, curClean) >= 85 },
    { key: 'a6', emoji: '💨', name: 'Комбо!', desc: '3 дела подряд', unlocked: state.maxCombo >= 3 },
    { key: 'a7', emoji: '🧽', name: 'Марафонец', desc: '20 дел закрыто', unlocked: totalDone >= 20 },
    { key: 'a8', emoji: '🏠', name: 'Всё блестит', desc: 'Все комнаты чистые', unlocked: allClean },
    { key: 'a9', emoji: '🌋', name: 'Две недели огня', desc: 'Серия 14 дней', unlocked: state.streak >= 14 },
    { key: 'a10', emoji: '🌟', name: 'Несгибаемость', desc: 'Серия 30 дней', unlocked: state.streak >= 30 },
    { key: 'a11', emoji: '🏃', name: 'Полтинник', desc: '50 дел закрыто', unlocked: totalDone >= 50 },
    { key: 'a12', emoji: '🎯', name: 'Фокус-мастер', desc: '5 фокус-уборок', unlocked: state.focusDone >= 5 },
    { key: 'a13', emoji: '🛍️', name: 'Шопоголик', desc: '3 покупки в магазинчике', unlocked: state.purchasesCount >= 3 },
    { key: 'a14', emoji: '🐦', name: 'Ранняя пташка', desc: 'Дело закрыто до 9 утра', unlocked: state.earlyBird },
    { key: 'a15', emoji: '🦉', name: 'Ночная сова', desc: 'Дело закрыто после 22', unlocked: state.nightOwl },
    { key: 'a16', emoji: '💎', name: 'Стерильно', desc: 'Чистота 95% и выше', unlocked: Math.max(state.bestClean, curClean) >= 95 },
  ];
}

// --- Итог недели ---
export interface WeeklyStats {
  count: number;
  countLabel: string;
  streak: number;
  best: { name: string; emoji: string; pct: number };
  worst: { name: string; emoji: string; pct: number };
  isMulti: boolean;
  memberStats: { id: string; name: string; emoji: string; color: string; sparks: number; frac: number }[];
}
export function weeklyStats(state: PersistentState): WeeklyStats {
  const { log, dayOffset, rooms, tasks, members } = state;
  const weekLog: LogEntry[] = log.filter((l) => l.day > dayOffset - 7);
  const roomPcts = rooms.map((r: Room) => ({
    name: r.name,
    emoji: r.emoji,
    pct: Math.round(roomClean(tasks, r.id, dayOffset)),
  }));
  const best = roomPcts.slice().sort((a, b) => b.pct - a.pct)[0] || { name: '', emoji: '', pct: 0 };
  const worst = roomPcts.slice().sort((a, b) => a.pct - b.pct)[0] || { name: '', emoji: '', pct: 0 };
  const isMulti = members.length > 1;
  let memberStats: WeeklyStats['memberStats'] = [];
  if (isMulti) {
    const sums = members.map((m) => weekLog.filter((l) => l.member === m.id).reduce((a, l) => a + l.reward, 0));
    const mx = Math.max(1, ...sums);
    memberStats = members.map((m, i) => ({
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      color: m.color,
      sparks: sums[i],
      frac: sums[i] / mx,
    }));
  }
  return {
    count: weekLog.length,
    countLabel: plural(weekLog.length, ['дело', 'дела', 'дел']),
    streak: state.streak,
    best,
    worst,
    isMulti,
    memberStats,
  };
}

// --- Прогресс уровня ---
export interface LevelProgress {
  name: string;
  emoji: string;
  num: string;
  toNextLabel: string;
  frac: number;
}
export function levelProgress(state: PersistentState): LevelProgress {
  const totalDone = state.totalDone;
  const lvl = levelOf(totalDone);
  const tiersMax = [6, 14, 26, 45, Infinity];
  const nextMax = tiersMax[lvl.idx];
  const prevMax = lvl.idx === 0 ? 0 : tiersMax[lvl.idx - 1];
  const toNext = nextMax === Infinity ? 0 : nextMax - totalDone;
  const frac = nextMax === Infinity ? 1 : clamp01((totalDone - prevMax) / (nextMax - prevMax));
  return {
    name: lvl.name,
    emoji: lvl.emoji,
    num: `ур. ${lvl.idx + 1}`,
    toNextLabel:
      nextMax === Infinity
        ? 'максимальный уровень ✨'
        : `ещё ${toNext} ${plural(toNext, ['дело', 'дела', 'дел'])} до нового уровня`,
    frac,
  };
}
