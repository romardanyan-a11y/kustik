// Стартовый сид «Кустик» — точные данные из прототипа (seed.json / Кустик.dc.html).
import type { LogEntry, PersistentState, Room, Task, Member, ShopItem } from './types';

export const SEED_ROOMS: Room[] = [
  { id: 'k', name: 'Кухня', emoji: '🍳', tint: '#F3D8C6', accent: '#C56A4B' },
  { id: 'b', name: 'Ванная', emoji: '🛁', tint: '#D9E7E6', accent: '#5E9C92' },
  { id: 's', name: 'Спальня', emoji: '🛏️', tint: '#ECDFC9', accent: '#B98A5E' },
  { id: 'l', name: 'Гостиная', emoji: '🛋️', tint: '#DEE8D2', accent: '#6E9C63' },
  { id: 'h', name: 'Прихожая', emoji: '🚪', tint: '#F0E1CD', accent: '#C99A5C' },
];

const T = (id: string, roomId: string, name: string, freq: number, ago: number): Task => ({
  id,
  roomId,
  name,
  freq,
  lastDay: -ago,
});

export const SEED_TASKS: Task[] = [
  T('k1', 'k', 'Посуда и раковина', 1, 2),
  T('k2', 'k', 'Столешница и плита', 2, 3),
  T('k3', 'k', 'Пол', 3, 2),
  T('k4', 'k', 'Вынести мусор', 2, 1),
  T('k5', 'k', 'Холодильник внутри', 30, 12),
  T('b1', 'b', 'Раковина и зеркало', 3, 4),
  T('b2', 'b', 'Унитаз', 3, 1),
  T('b3', 'b', 'Душ / ванна', 7, 8),
  T('b4', 'b', 'Пол', 7, 3),
  T('s1', 's', 'Проветрить и заправить', 1, 1),
  T('s2', 's', 'Протереть пыль', 7, 4),
  T('s3', 's', 'Пол / пылесос', 7, 9),
  T('s4', 's', 'Сменить бельё', 14, 11),
  T('l1', 'l', 'Разобрать вещи', 2, 2),
  T('l2', 'l', 'Пол', 5, 2),
  T('l3', 'l', 'Протереть пыль', 7, 3),
  T('l4', 'l', 'Подоконники', 14, 5),
  T('h1', 'h', 'Пол', 5, 4),
  T('h2', 'h', 'Зеркало', 14, 6),
  T('h3', 'h', 'Полки от пыли', 10, 4),
];

export const DEFAULT_MEMBERS: Member[] = [
  { id: 'm1', name: 'Аня', emoji: '👩', color: '#C56A4B' },
  { id: 'm2', name: 'Паша', emoji: '🧔', color: '#5E9C92' },
  { id: 'm3', name: 'Лето', emoji: '🧒', color: '#6E9C63' },
];

export function defaultMembers(n: number): Member[] {
  return DEFAULT_MEMBERS.slice(0, n).map((m) => ({ ...m }));
}

function makeSeedLog(): LogEntry[] {
  const out: LogEntry[] = [];
  const sm = ['m1', 'm2', 'm1', 'm3', 'm2', 'm1', 'm2', 'm3', 'm1', 'm2', 'm1', 'm3', 'm2'];
  const sd = [-6, -6, -5, -5, -4, -4, -3, -3, -2, -2, -1, -1, -1];
  for (let i = 0; i < sd.length; i++) {
    out.push({ day: sd[i], member: sm[i], reward: 5 + (i % 4) });
  }
  return out;
}

export function makeInitialState(): PersistentState {
  const turns: Record<string, number> = {};
  SEED_TASKS.forEach((t, i) => {
    turns[t.id] = i;
  });
  return {
    rooms: SEED_ROOMS.map((r) => ({ ...r })),
    tasks: SEED_TASKS.map((t) => ({ ...t })),
    dayOffset: 0,
    mode: 'one',
    members: [],
    me: 'm1',
    turns,
    filter: 'all',
    log: makeSeedLog(),
    reminderOn: true,
    reminderHour: 9,
    sparks: 140,
    streak: 5,
    streakBumped: false,
    owned: { pot_terracotta: true, fit_none: true },
    potSkin: 'terracotta',
    outfit: 'none',
    bestClean: 0,
    maxCombo: 1,
    freezes: 2,
    autoFreeze: true,
    uid: 100,
  };
}

// Частоты-пресеты редактора.
export const FREQ_PRESETS = [
  { label: 'Ежедневно', v: 1 },
  { label: '3 дня', v: 3 },
  { label: 'Неделя', v: 7 },
  { label: '2 недели', v: 14 },
  { label: 'Месяц', v: 30 },
];

// Магазин.
export const POT_ITEMS: ShopItem[] = [
  { id: 'pot_terracotta', kind: 'pot', val: 'terracotta', cost: 0, name: 'Терракота', color: '#C56A4B' },
  { id: 'pot_sage', kind: 'pot', val: 'sage', cost: 60, name: 'Шалфей', color: '#6E9C63' },
  { id: 'pot_blue', kind: 'pot', val: 'blue', cost: 80, name: 'Дымка', color: '#5E89A6' },
  { id: 'pot_plum', kind: 'pot', val: 'plum', cost: 90, name: 'Слива', color: '#9B7FB0' },
  { id: 'pot_sand', kind: 'pot', val: 'sand', cost: 70, name: 'Песок', color: '#D8A24E' },
];

export const FIT_ITEMS: ShopItem[] = [
  { id: 'fit_none', kind: 'fit', val: 'none', cost: 0, name: 'Без наряда', emoji: '🌱' },
  { id: 'fit_hat', kind: 'fit', val: 'hat', cost: 80, name: 'Колпачок', emoji: '🎉' },
  { id: 'fit_scarf', kind: 'fit', val: 'scarf', cost: 60, name: 'Шарфик', emoji: '🧣' },
  { id: 'fit_glasses', kind: 'fit', val: 'glasses', cost: 100, name: 'Очки', emoji: '🕶️' },
];

// Скины горшка [тело, обод].
export const POT_SKINS: Record<string, [string, string]> = {
  terracotta: ['#C56A4B', '#B65C3E'],
  sage: ['#6E9C63', '#5C8753'],
  blue: ['#5E89A6', '#4E7791'],
  plum: ['#9B7FB0', '#85699A'],
  sand: ['#D8A24E', '#C28C3C'],
};

// Эмодзи для выбора иконки комнаты.
export const ROOM_EMOJI_CHOICES = ['🍳', '🛁', '🛏️', '🛋️', '🚪', '🧺', '🪴', '🧹', '🚽', '💻', '🧸', '🌿'];

// Палитра новых комнат.
export const NEW_ROOM_TINTS = ['#F3D8C6', '#D9E7E6', '#ECDFC9', '#DEE8D2', '#F0E1CD', '#E9DCEC'];
export const NEW_ROOM_ACCENTS = ['#C56A4B', '#5E9C92', '#B98A5E', '#6E9C63', '#C99A5C', '#9B7FB0'];

// Пул новых участников.
export const MEMBER_EMOJI_POOL = ['🧑', '👧', '👦', '🧓', '👵', '🧑‍🦱'];
export const MEMBER_COLOR_POOL = ['#C99A5C', '#9B7FB0', '#B98A5E', '#6E9C63', '#5E9C92'];
