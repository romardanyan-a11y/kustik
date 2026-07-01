// Стартовый сид «Кустик» — точные данные из прототипа (seed.json / Кустик.dc.html).
import type { PersistentState, Room, Task, Member, ShopItem } from './types';

export const SEED_ROOMS: Room[] = [
  { id: 'k', name: 'Кухня', emoji: '🍳', tint: '#F3D8C6', accent: '#C56A4B' },
  { id: 'b', name: 'Ванная', emoji: '🛁', tint: '#D9E7E6', accent: '#5E9C92' },
  { id: 's', name: 'Спальня', emoji: '🛏️', tint: '#ECDFC9', accent: '#B98A5E' },
  { id: 'l', name: 'Гостиная', emoji: '🛋️', tint: '#DEE8D2', accent: '#6E9C63' },
  { id: 'h', name: 'Прихожая', emoji: '🚪', tint: '#F0E1CD', accent: '#C99A5C' },
];

// daysAgo хранится в lastDay как -ago; при создании состояния сдвигается
// на реальный индекс дня (см. makeInitialState).
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

// Чистое стартовое состояние на реальном дне today (индекс локальных суток).
// Задачи получают «возраст» из сида (daysAgo), поэтому в первый день уже
// есть 7 дел «пора» и чистота ≈61% — первый дофамин гарантирован.
export function makeInitialState(today: number): PersistentState {
  const turns: Record<string, number> = {};
  SEED_TASKS.forEach((t, i) => {
    turns[t.id] = i;
  });
  return {
    rooms: SEED_ROOMS.map((r) => ({ ...r })),
    tasks: SEED_TASKS.map((t) => ({ ...t, lastDay: today + t.lastDay })),
    dayOffset: today,
    mode: 'one',
    members: [],
    me: 'm1',
    turns,
    filter: 'all',
    log: [],
    reminderOn: true,
    reminderHour: 9,
    sparks: 140,
    streak: 0,
    streakBumped: false,
    owned: { pot_terracotta: true, fit_none: true, bg_classic: true },
    potSkin: 'terracotta',
    outfit: 'none',
    bgTheme: 'classic',
    bestClean: 0,
    maxCombo: 1,
    freezes: 2,
    autoFreeze: true,
    uid: 100,
    totalDone: 0,
    achUnlocked: {},
    onboarded: false,
    homeId: null,
    homeRev: 0,
    questBonusDay: -1,
    cleanHistory: {},
    focusDone: 0,
    purchasesCount: 0,
    earlyBird: false,
    nightOwl: false,
  };
}

// Квест дня: закрой N дел — получи бонус.
export const QUEST_GOAL = 3;
export const QUEST_BONUS = 25;

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
  { id: 'pot_berry', kind: 'pot', val: 'berry', cost: 120, name: 'Клубника', color: '#C96A6A' },
];

export const FIT_ITEMS: ShopItem[] = [
  { id: 'fit_none', kind: 'fit', val: 'none', cost: 0, name: 'Без наряда', emoji: '🌱' },
  { id: 'fit_hat', kind: 'fit', val: 'hat', cost: 80, name: 'Колпачок', emoji: '🎉' },
  { id: 'fit_scarf', kind: 'fit', val: 'scarf', cost: 60, name: 'Шарфик', emoji: '🧣' },
  { id: 'fit_glasses', kind: 'fit', val: 'glasses', cost: 100, name: 'Очки', emoji: '🕶️' },
  { id: 'fit_bow', kind: 'fit', val: 'bow', cost: 90, name: 'Бантик', emoji: '🎀' },
  { id: 'fit_mustache', kind: 'fit', val: 'mustache', cost: 70, name: 'Усы', emoji: '🥸' },
];

// Премиум за Telegram Stars (цена в ⭐, покупается через инвойс бота).
export const PREMIUM_ITEMS: ShopItem[] = [
  { id: 'pot_gold', kind: 'pot', val: 'gold', cost: 25, name: 'Золотой', color: '#E0B14B' },
];

// Темы фона приложения (вертикальный градиент [верх, низ]).
export const BG_ITEMS: ShopItem[] = [
  { id: 'bg_classic', kind: 'bg', val: 'classic', cost: 0, name: 'Классика' },
  { id: 'bg_dawn', kind: 'bg', val: 'dawn', cost: 100, name: 'Рассвет' },
  { id: 'bg_mint', kind: 'bg', val: 'mint', cost: 100, name: 'Мята' },
  { id: 'bg_lavender', kind: 'bg', val: 'lavender', cost: 120, name: 'Лаванда' },
  { id: 'bg_sky', kind: 'bg', val: 'sky', cost: 120, name: 'Небо' },
];

export const BG_THEMES: Record<string, [string, string]> = {
  classic: ['#F8EFE0', '#F2E7D3'],
  dawn: ['#F9E9E2', '#F3D9CE'],
  mint: ['#EDF4E6', '#DCEAD2'],
  lavender: ['#F2ECF7', '#E4DAEE'],
  sky: ['#E7F0F6', '#D6E5EF'],
};

// Скины горшка [тело, обод].
export const POT_SKINS: Record<string, [string, string]> = {
  terracotta: ['#C56A4B', '#B65C3E'],
  sage: ['#6E9C63', '#5C8753'],
  blue: ['#5E89A6', '#4E7791'],
  plum: ['#9B7FB0', '#85699A'],
  sand: ['#D8A24E', '#C28C3C'],
  berry: ['#C96A6A', '#B25454'],
  gold: ['#E0B14B', '#C29232'],
};

// Эмодзи для выбора иконки комнаты.
export const ROOM_EMOJI_CHOICES = ['🍳', '🛁', '🛏️', '🛋️', '🚪', '🧺', '🪴', '🧹', '🚽', '💻', '🧸', '🌿'];

// Палитра новых комнат.
export const NEW_ROOM_TINTS = ['#F3D8C6', '#D9E7E6', '#ECDFC9', '#DEE8D2', '#F0E1CD', '#E9DCEC'];
export const NEW_ROOM_ACCENTS = ['#C56A4B', '#5E9C92', '#B98A5E', '#6E9C63', '#C99A5C', '#9B7FB0'];

// Пул новых участников.
export const MEMBER_EMOJI_POOL = ['🧑', '👧', '👦', '🧓', '👵', '🧑‍🦱'];
export const MEMBER_COLOR_POOL = ['#C99A5C', '#9B7FB0', '#B98A5E', '#6E9C63', '#5E9C92'];
