// Модель данных «Кустик».

export interface Room {
  id: string;
  name: string;
  emoji: string;
  tint: string;
  accent: string;
}

export interface Task {
  id: string;
  roomId: string;
  name: string;
  freq: number; // частота в днях
  lastDay: number; // день последнего выполнения в шкале dayOffset (в проде — дата)
  note?: string;
}

export interface Member {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface LogEntry {
  day: number;
  member: string; // id участника или 'me'
  reward: number;
}

export type Mode = 'one' | 'duo' | 'family';
export type Tab = 'today' | 'rooms' | 'settings';
export type Filter = 'all' | 'mine' | string; // string = member id

export interface TimerState {
  taskId: string;
  name: string;
  total: number; // секунды
  remaining: number;
  running: boolean;
}

export interface EditingTask {
  id: string | null;
  name: string;
  roomId: string;
  freq: number;
  lastAgo: number;
  note: string;
  isNew: boolean;
}

export interface EditingRoom {
  id: string | null;
  name: string;
  emoji: string;
  tint: string;
  accent: string;
}

// Стойкая (сохраняемая) часть состояния.
export interface PersistentState {
  rooms: Room[];
  tasks: Task[];
  // Индекс «сегодняшних» суток (todayIndex()). Название историческое:
  // в прототипе это был демо-сдвиг, теперь — реальный день.
  dayOffset: number;
  mode: Mode;
  members: Member[];
  me: string;
  turns: Record<string, number>;
  filter: Filter;
  log: LogEntry[];
  reminderOn: boolean;
  reminderHour: number;
  sparks: number;
  streak: number;
  streakBumped: boolean;
  owned: Record<string, boolean>;
  potSkin: string;
  outfit: string;
  bestClean: number;
  maxCombo: number;
  freezes: number;
  autoFreeze: boolean;
  uid: number;
  // Всего выполнено дел за всю историю (метрика уровней).
  // Отдельно от log, потому что log подрезается по времени.
  totalDone: number;
  // Разблокированные достижения навсегда: ключ → день разблокировки.
  achUnlocked: Record<string, number>;
  // Пройден ли онбординг.
  onboarded: boolean;
  // Совместный дом (Telegram): id дома и последняя известная ревизия сервера.
  // Локальные поля — в общий документ не входят.
  homeId: string | null;
  homeRev: number;
}

export interface ShopItem {
  id: string;
  kind: 'pot' | 'fit';
  val: string;
  cost: number;
  name: string;
  color?: string;
  emoji?: string;
}
