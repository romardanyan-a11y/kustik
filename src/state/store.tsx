// Стор «Кустик» — всё состояние приложения и действия. Порт класса Component.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  defaultMembers,
  FIT_ITEMS,
  makeInitialState,
  MEMBER_COLOR_POOL,
  MEMBER_EMOJI_POOL,
  NEW_ROOM_ACCENTS,
  NEW_ROOM_TINTS,
  POT_ITEMS,
} from '../data/seed';
import type {
  EditingRoom,
  EditingTask,
  Mode,
  PersistentState,
  ShopItem,
  Tab,
  TimerState,
  Filter,
} from '../data/types';
import { achievements, computeDue, daysSince, levelOf, overallClean, assignee, reward as rewardFn } from '../engine/engine';
import { todayIndex } from '../engine/time';
import { apiHomeCreate, apiHomeJoin, apiHomeSync, apiReminder, HomeMemberDoc } from '../telegram/api';
import { cloudLoad, cloudSave, isInTelegram, telegramHaptic } from '../telegram/telegram';

const STORAGE_KEY = 'kustik.state.v1';
const COMBO_WINDOW_MS = 5000;

interface CelebrationInfo {
  reward: string;
  combo: string;
  stamp: number;
}

interface EphemeralState {
  tab: Tab;
  achToast: string | null;
  homeBusy: boolean; // идёт создание/вступление в общий дом
  editing: EditingTask | null;
  editingRoom: EditingRoom | null;
  timer: TimerState | null;
  express: boolean;
  shopOpen: boolean;
  achOpen: boolean;
  showCelebration: boolean;
  showSoon: boolean;
  levelUpName: string | null;
  expandedRoom: string | null;
  celebrating: Record<string, CelebrationInfo>;
  collapsing: Record<string, boolean>;
  plantPop: boolean;
  sparksDisplay: number; // анимируемое отображение искр
}

export type AppState = PersistentState & EphemeralState;

interface Actions {
  setTab: (t: Tab) => void;
  openEdit: (id: string) => void;
  newTask: (roomId?: string) => void;
  editPatch: (p: Partial<EditingTask>) => void;
  closeEdit: () => void;
  saveEdit: () => void;
  deleteTask: () => void;
  newRoom: () => void;
  patchRoom: (p: Partial<EditingRoom>) => void;
  closeRoom: () => void;
  saveRoom: () => void;
  nextDay: () => void;
  setMode: (m: Mode) => void;
  addMember: () => void;
  removeMember: (id: string) => void;
  renameMember: (id: string, v: string) => void;
  setMe: (id: string) => void;
  setFilter: (f: Filter) => void;
  setReminderHour: (h: number) => void;
  toggleReminder: () => void;
  snooze: () => void;
  toggleExpress: () => void;
  openShop: () => void;
  closeShop: () => void;
  openAch: () => void;
  closeAch: () => void;
  buyEquip: (item: ShopItem) => void;
  toggleFreeze: () => void;
  startTimer: (id: string, mins: number) => void;
  pauseTimer: () => void;
  setTimerMins: (mins: number) => void;
  closeTimer: () => void;
  finishTimer: () => void;
  complete: (id: string) => void;
  toggleRoom: (id: string) => void;
  closeCelebration: () => void;
  openSoon: () => void;
  closeSoon: () => void;
  resetAll: () => void;
  completeOnboarding: (roomIds: string[]) => void;
  createHome: () => void;
  joinHome: (homeId: string) => void;
  leaveHome: () => void;
}

const StoreContext = createContext<{ state: AppState; actions: Actions; hydrated: boolean } | null>(null);

const PERSISTENT_KEYS: (keyof PersistentState)[] = [
  'rooms', 'tasks', 'dayOffset', 'mode', 'members', 'me', 'turns', 'filter', 'log',
  'reminderOn', 'reminderHour', 'sparks', 'streak', 'streakBumped', 'owned', 'potSkin',
  'outfit', 'bestClean', 'maxCombo', 'freezes', 'autoFreeze', 'uid',
  'totalDone', 'achUnlocked', 'onboarded', 'homeId', 'homeRev',
];

// Что уходит в общий документ дома (household-уровень).
// Личное (me, filter, reminder*, onboarded, homeId/homeRev) остаётся на устройстве.
const SHARED_KEYS: (keyof PersistentState)[] = [
  'rooms', 'tasks', 'mode', 'members', 'turns', 'log', 'sparks', 'streak', 'streakBumped',
  'owned', 'potSkin', 'outfit', 'bestClean', 'maxCombo', 'freezes', 'autoFreeze', 'uid',
  'totalDone', 'achUnlocked', 'dayOffset',
];

function buildShared(state: AppState): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  SHARED_KEYS.forEach((k) => {
    out[k] = state[k];
  });
  return out;
}

// Журнал держим компактным (CloudStorage-лимиты): последние 30 дней, максимум 500 записей.
// Метрика уровней — totalDone, поэтому подрезка журнала ничего не ломает.
function trimLog(log: PersistentState['log'], today: number): PersistentState['log'] {
  return log.filter((l) => l.day > today - 30).slice(-500);
}

// Миграция сейва эпохи демо-прототипа (dayOffset от 0) на реальные дни.
function migrateSave(saved: Partial<PersistentState>, today: number): Partial<PersistentState> {
  const s = { ...saved };
  if (s.totalDone == null) {
    const shift = today - (s.dayOffset ?? 0);
    if (s.tasks) s.tasks = s.tasks.map((t) => ({ ...t, lastDay: t.lastDay + shift }));
    if (s.log) s.log = s.log.map((l) => ({ ...l, day: l.day + shift }));
    s.dayOffset = today;
    s.totalDone = s.log ? s.log.length : 0;
    s.achUnlocked = s.achUnlocked ?? {};
    // Старый сейв = человек уже пользовался, онбординг не показываем.
    s.onboarded = true;
  }
  return s;
}

function makeFullInitial(): AppState {
  return {
    ...makeInitialState(todayIndex()),
    tab: 'today',
    achToast: null,
    homeBusy: false,
    editing: null,
    editingRoom: null,
    timer: null,
    express: false,
    shopOpen: false,
    achOpen: false,
    showCelebration: false,
    showSoon: false,
    levelUpName: null,
    expandedRoom: 'k',
    celebrating: {},
    collapsing: {},
    plantPop: false,
    sparksDisplay: 140,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(makeFullInitial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [hydrated, setHydrated] = useState(false);

  // Таймеры / анимации
  const timerInt = useRef<ReturnType<typeof setInterval> | null>(null);
  const sparksTarget = useRef(140);
  const sparksRaf = useRef<number | null>(null);
  const comboTime = useRef(0);
  const comboCount = useRef(0);
  const dead = useRef(false);
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Вечные достижения: фиксируем новые разблокировки в achUnlocked ---
  const evalAch = useCallback((next: AppState, withToast: boolean): AppState => {
    const defs = achievements(next);
    const un = { ...next.achUnlocked };
    let firstNew: { emoji: string; name: string } | null = null;
    let changed = false;
    for (const a of defs) {
      if (a.unlocked && un[a.key] == null) {
        un[a.key] = next.dayOffset;
        changed = true;
        if (!firstNew) firstNew = { emoji: a.emoji, name: a.name };
      }
    }
    if (!changed) return next;
    const out = { ...next, achUnlocked: un };
    if (withToast && firstNew) {
      out.achToast = `${firstNew.emoji} ${firstNew.name}`;
      setTimeout(() => {
        if (!dead.current) setState((s) => ({ ...s, achToast: null }));
      }, 2600);
    }
    return out;
  }, []);

  // --- Переход на текущий день: пропущенные дни сжигают заморозки/серию ---
  const advanceToToday = useCallback(() => {
    const today = todayIndex();
    setState((s) => {
      if (today <= s.dayOffset) return s;
      let streak = s.streak;
      let freezes = s.freezes;
      let bumped = s.streakBumped;
      for (let d = s.dayOffset; d < today; d++) {
        if (!bumped) {
          if (s.autoFreeze && freezes > 0) freezes -= 1;
          else streak = 0;
        }
        bumped = false; // все последующие пропущенные дни точно без выполнений
      }
      return { ...s, dayOffset: today, streak, freezes, streakBumped: false, log: trimLog(s.log, today) };
    });
  }, []);

  // --- Гидрация: CloudStorage Telegram → localStorage → сид ---
  useEffect(() => {
    (async () => {
      try {
        let raw: string | null = null;
        try {
          raw = await cloudLoad(STORAGE_KEY);
        } catch {
          // облако недоступно — идём в локальное
        }
        if (!raw) raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = migrateSave(JSON.parse(raw) as Partial<PersistentState>, todayIndex());
          setState((s) => {
            const merged = { ...s, ...saved } as AppState;
            sparksTarget.current = merged.sparks;
            merged.sparksDisplay = merged.sparks;
            return evalAch(merged, false);
          });
        }
      } catch {
        // игнорируем — стартуем с сидом
      }
      setHydrated(true);
      advanceToToday();
    })();
    return () => {
      dead.current = true;
      if (timerInt.current) clearInterval(timerInt.current);
      if (sparksRaf.current) cancelAnimationFrame(sparksRaf.current);
      if (cloudTimer.current) clearTimeout(cloudTimer.current);
    };
  }, [advanceToToday, evalAch]);

  // --- Следим за сменой суток: раз в минуту и при возврате в приложение ---
  useEffect(() => {
    const int = setInterval(advanceToToday, 60000);
    let visHandler: (() => void) | null = null;
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      visHandler = () => {
        if (document.visibilityState === 'visible') advanceToToday();
      };
      document.addEventListener('visibilitychange', visHandler);
    }
    return () => {
      clearInterval(int);
      if (visHandler) document.removeEventListener('visibilitychange', visHandler);
    };
  }, [advanceToToday]);

  // --- Персистенция: локально сразу, в облако Telegram — с дебаунсом ---
  useEffect(() => {
    if (!hydrated) return;
    const persistent: Partial<PersistentState> = {};
    PERSISTENT_KEYS.forEach((k) => {
      (persistent as Record<string, unknown>)[k] = state[k];
    });
    const json = JSON.stringify(persistent);
    AsyncStorage.setItem(STORAGE_KEY, json).catch(() => {});
    if (cloudTimer.current) clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(() => {
      cloudSave(STORAGE_KEY, json).catch(() => {});
    }, 1500);
  }, [hydrated, ...PERSISTENT_KEYS.map((k) => state[k])]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===========================================================================
  // Совместный дом: push с дебаунсом, pull по фокусу/интервалу, create/join.
  // Модель: last-write-wins по ревизиям; конфликт — принимаем серверное.
  // ===========================================================================
  const skipPush = useRef(false);
  const pushDirty = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Применить серверный снапшот (общие ключи + участники) к локальному состоянию.
  const applyHome = useCallback(
    (
      snap: { state?: Partial<PersistentState> | null; members?: HomeMemberDoc[]; rev: number },
      extra?: Partial<AppState>
    ) => {
      skipPush.current = true;
      setState((s) => {
        const merged: AppState = { ...s, ...extra };
        if (snap.state) {
          SHARED_KEYS.forEach((k) => {
            const v = (snap.state as Record<string, unknown>)[k];
            if (v !== undefined) (merged as unknown as Record<string, unknown>)[k] = v;
          });
        }
        if (snap.members) {
          merged.members = snap.members.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color }));
        }
        merged.homeRev = snap.rev;
        return evalAch(merged, false);
      });
      // Снапшот мог приехать со «вчерашним» днём — выравниваем на сегодня.
      setTimeout(() => advanceToToday(), 0);
    },
    [advanceToToday, evalAch]
  );

  const doPush = useCallback(async () => {
    const s = stateRef.current;
    if (!s.homeId) return;
    pushDirty.current = false;
    const res = await apiHomeSync(s.homeId, s.homeRev, buildShared(s));
    if (!res) {
      pushDirty.current = true; // сеть моргнула — ретрай при следующем pull
      return;
    }
    if (res.conflict) {
      applyHome(res);
      return;
    }
    skipPush.current = true;
    setState((s2) => ({ ...s2, homeRev: res.rev }));
  }, [applyHome]);

  // Push при изменении общих ключей.
  useEffect(() => {
    if (!hydrated || !state.homeId) return;
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    pushDirty.current = true;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(doPush, 1200);
  }, [hydrated, state.homeId, doPush, ...SHARED_KEYS.map((k) => state[k])]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pull при возврате в приложение и раз в 45 секунд (+ ретрай незапушенного).
  useEffect(() => {
    if (!hydrated || !state.homeId) return;
    const pull = async () => {
      const s = stateRef.current;
      if (!s.homeId) return;
      if (pushDirty.current) {
        doPush();
        return;
      }
      const res = await apiHomeSync(s.homeId, s.homeRev);
      if (res && res.rev > stateRef.current.homeRev) applyHome(res);
    };
    pull();
    const int = setInterval(pull, 45000);
    let vis: (() => void) | null = null;
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      vis = () => {
        if (document.visibilityState === 'visible') pull();
      };
      document.addEventListener('visibilitychange', vis);
    }
    return () => {
      clearInterval(int);
      if (vis) document.removeEventListener('visibilitychange', vis);
    };
  }, [hydrated, state.homeId, applyHome, doPush]);

  const createHome = useCallback(() => {
    const s = stateRef.current;
    if (s.homeId || s.homeBusy) return;
    setState((x) => ({ ...x, homeBusy: true }));
    (async () => {
      // Локальные «фейковые» участники в общий дом не едут — реальные придут из Telegram.
      const payload = buildShared({ ...s, mode: 'one', members: [] } as AppState);
      const snap = await apiHomeCreate(payload);
      if (!snap) {
        setState((x) => ({ ...x, homeBusy: false }));
        return;
      }
      applyHome(snap, {
        homeId: snap.homeId,
        me: snap.member.id,
        homeBusy: false,
        mode: 'one',
        members: [{ id: snap.member.id, name: snap.member.name, emoji: snap.member.emoji, color: snap.member.color }],
        filter: 'all',
      });
    })();
  }, [applyHome]);

  const joinHome = useCallback(
    (homeId: string) => {
      const s = stateRef.current;
      if (s.homeBusy || !homeId || s.homeId === homeId) return;
      setState((x) => ({ ...x, homeBusy: true }));
      (async () => {
        const snap = await apiHomeJoin(homeId);
        if (!snap) {
          setState((x) => ({ ...x, homeBusy: false }));
          return;
        }
        applyHome(snap, {
          homeId: snap.homeId,
          me: snap.member.id,
          homeBusy: false,
          onboarded: true, // общий дом уже настроен создателем
          filter: 'all',
        });
      })();
    },
    [applyHome]
  );

  const leaveHome = useCallback(() => {
    setState((s) => ({ ...s, homeId: null, homeRev: 0, mode: 'one', members: [], me: 'm1', filter: 'all' }));
  }, []);

  // --- Регистрация ежедневного напоминания у бота ---
  const remTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated || !isInTelegram()) return;
    if (remTimer.current) clearTimeout(remTimer.current);
    remTimer.current = setTimeout(() => {
      apiReminder(stateRef.current.reminderOn, stateRef.current.reminderHour);
    }, 800);
  }, [hydrated, state.reminderOn, state.reminderHour]);

  // --- Анимация счётчика искр ---
  // Важно: sparks (источник истины) меняется мгновенно в действиях;
  // здесь анимируется только отображение sparksDisplay. Если rAF не успеет
  // (вкладку свернули), награда всё равно уже сохранена.
  const tweenSparks = useCallback(() => {
    if (sparksRaf.current) cancelAnimationFrame(sparksRaf.current);
    const start = stateRef.current.sparksDisplay;
    const end = sparksTarget.current;
    const t0 = Date.now();
    const dur = 520;
    const step = () => {
      if (dead.current) return;
      const k = Math.min(1, (Date.now() - t0) / dur);
      const v = Math.round(start + (end - start) * (1 - Math.pow(1 - k, 3)));
      setState((s) => ({ ...s, sparksDisplay: v }));
      if (k < 1) sparksRaf.current = requestAnimationFrame(step);
    };
    sparksRaf.current = requestAnimationFrame(step);
  }, []);

  // --- Действия ---
  const setTab = useCallback((t: Tab) => setState((s) => ({ ...s, tab: t })), []);
  const toggleRoom = useCallback(
    (id: string) => setState((s) => ({ ...s, expandedRoom: s.expandedRoom === id ? null : id })),
    []
  );

  const openEdit = useCallback((id: string) => {
    setState((s) => {
      const t = s.tasks.find((x) => x.id === id);
      if (!t) return s;
      return {
        ...s,
        editing: {
          id: t.id,
          name: t.name,
          roomId: t.roomId,
          freq: t.freq,
          lastAgo: Math.max(0, daysSince(t, s.dayOffset)),
          note: t.note || '',
          isNew: false,
        },
      };
    });
  }, []);

  const newTask = useCallback((roomId?: string) => {
    setState((s) => ({
      ...s,
      editing: { id: null, name: '', roomId: roomId || s.rooms[0].id, freq: 7, lastAgo: 0, note: '', isNew: true },
    }));
  }, []);

  const editPatch = useCallback(
    (p: Partial<EditingTask>) => setState((s) => (s.editing ? { ...s, editing: { ...s.editing, ...p } } : s)),
    []
  );
  const closeEdit = useCallback(() => setState((s) => ({ ...s, editing: null })), []);

  const saveEdit = useCallback(() => {
    setState((s) => {
      const e = s.editing;
      if (!e || !e.name.trim()) return s;
      if (e.id == null) {
        const id = 'u' + (s.uid + 1);
        return {
          ...s,
          tasks: [
            ...s.tasks,
            { id, roomId: e.roomId, name: e.name.trim(), freq: e.freq, note: (e.note || '').trim(), lastDay: s.dayOffset - e.lastAgo },
          ],
          uid: s.uid + 1,
          editing: null,
          expandedRoom: e.roomId,
        };
      }
      return {
        ...s,
        tasks: s.tasks.map((x) =>
          x.id === e.id
            ? { ...x, name: e.name.trim(), roomId: e.roomId, freq: e.freq, note: (e.note || '').trim(), lastDay: s.dayOffset - e.lastAgo }
            : x
        ),
        editing: null,
      };
    });
  }, []);

  const deleteTask = useCallback(() => {
    setState((s) => {
      const e = s.editing;
      if (!e) return s;
      if (e.id == null) return { ...s, editing: null };
      return { ...s, tasks: s.tasks.filter((x) => x.id !== e.id), editing: null };
    });
  }, []);

  const newRoom = useCallback(() => {
    setState((s) => {
      const i = s.rooms.length % NEW_ROOM_TINTS.length;
      return {
        ...s,
        editingRoom: { id: null, name: '', emoji: '🪴', tint: NEW_ROOM_TINTS[i], accent: NEW_ROOM_ACCENTS[i] },
      };
    });
  }, []);
  const patchRoom = useCallback(
    (p: Partial<EditingRoom>) => setState((s) => (s.editingRoom ? { ...s, editingRoom: { ...s.editingRoom, ...p } } : s)),
    []
  );
  const closeRoom = useCallback(() => setState((s) => ({ ...s, editingRoom: null })), []);
  const saveRoom = useCallback(() => {
    setState((s) => {
      const e = s.editingRoom;
      if (!e || !e.name.trim()) return s;
      const id = 'r' + (s.uid + 1);
      return {
        ...s,
        rooms: [...s.rooms, { id, name: e.name.trim(), emoji: e.emoji, tint: e.tint, accent: e.accent }],
        uid: s.uid + 1,
        editingRoom: null,
        expandedRoom: id,
        tab: 'rooms',
      };
    });
  }, []);

  const nextDay = useCallback(() => {
    setState((s) => {
      let streak = s.streak;
      let freezes = s.freezes;
      if (!s.streakBumped) {
        if (s.autoFreeze && freezes > 0) freezes -= 1;
        else streak = 0;
      }
      return { ...s, dayOffset: s.dayOffset + 1, streakBumped: false, streak, freezes };
    });
  }, []);

  const setMode = useCallback((m: Mode) => {
    setState((s) => {
      let members: PersistentState['members'];
      if (m === 'one') members = [];
      else if (m === 'duo') members = s.members.length >= 2 ? s.members.slice(0, 2) : defaultMembers(2);
      else members = s.members.length >= 3 ? s.members : defaultMembers(3);
      const me = members.find((x) => x.id === s.me) ? s.me : members[0] ? members[0].id : 'm1';
      return { ...s, mode: m, members, me, filter: 'all' };
    });
  }, []);

  const addMember = useCallback(() => {
    setState((s) => {
      if (s.members.length >= 5) return s;
      const i = s.members.length;
      return {
        ...s,
        members: [
          ...s.members,
          { id: 'mm' + (s.uid + 1), name: 'Новый', emoji: MEMBER_EMOJI_POOL[i % MEMBER_EMOJI_POOL.length], color: MEMBER_COLOR_POOL[i % MEMBER_COLOR_POOL.length] },
        ],
        uid: s.uid + 1,
      };
    });
  }, []);
  const removeMember = useCallback((id: string) => {
    setState((s) => {
      if (s.members.length <= 2) return s;
      const members = s.members.filter((m) => m.id !== id);
      const me = s.me === id ? members[0].id : s.me;
      return { ...s, members, me };
    });
  }, []);
  const renameMember = useCallback(
    (id: string, v: string) => setState((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, name: v } : m)) })),
    []
  );
  const setMe = useCallback((id: string) => setState((s) => ({ ...s, me: id })), []);
  const setFilter = useCallback((f: Filter) => setState((s) => ({ ...s, filter: f })), []);
  const setReminderHour = useCallback((h: number) => setState((s) => ({ ...s, reminderHour: ((h % 24) + 24) % 24 })), []);
  const toggleReminder = useCallback(() => setState((s) => ({ ...s, reminderOn: !s.reminderOn })), []);
  const toggleFreeze = useCallback(() => setState((s) => ({ ...s, autoFreeze: !s.autoFreeze })), []);

  const snooze = useCallback(() => {
    setState((s) => {
      const e = s.editing;
      if (!e || e.id == null) return s;
      return {
        ...s,
        tasks: s.tasks.map((x) => (x.id === e.id ? { ...x, lastDay: s.dayOffset - Math.max(0, x.freq - 1) } : x)),
        editing: null,
      };
    });
  }, []);

  const toggleExpress = useCallback(() => setState((s) => ({ ...s, express: !s.express })), []);
  const openShop = useCallback(() => setState((s) => ({ ...s, shopOpen: true })), []);
  const closeShop = useCallback(() => setState((s) => ({ ...s, shopOpen: false })), []);
  const openAch = useCallback(() => setState((s) => ({ ...s, achOpen: true })), []);
  const closeAch = useCallback(() => setState((s) => ({ ...s, achOpen: false })), []);
  const openSoon = useCallback(() => setState((s) => ({ ...s, showSoon: true })), []);
  const closeSoon = useCallback(() => setState((s) => ({ ...s, showSoon: false })), []);
  const closeCelebration = useCallback(() => setState((s) => ({ ...s, showCelebration: false })), []);

  const buyEquip = useCallback((item: ShopItem) => {
    setState((s) => {
      const owned = { ...s.owned };
      let sparks = s.sparks;
      if (!owned[item.id]) {
        if (sparks < item.cost) return s;
        sparks -= item.cost;
        owned[item.id] = true;
      }
      const patch: Partial<AppState> = { owned, sparks, sparksDisplay: sparks };
      if (item.kind === 'pot') patch.potSkin = item.val;
      else patch.outfit = item.val;
      sparksTarget.current = sparks;
      return { ...s, ...patch };
    });
  }, []);

  // --- Таймер ---
  const tick = useCallback(() => {
    if (dead.current) return;
    const tm = stateRef.current.timer;
    if (!tm || !tm.running) return;
    if (tm.remaining <= 1) {
      if (timerInt.current) clearInterval(timerInt.current);
      finishTimerRef.current();
      return;
    }
    setState((s) => (s.timer ? { ...s, timer: { ...s.timer, remaining: s.timer.remaining - 1 } } : s));
  }, []);

  const startTimer = useCallback(
    (id: string, mins: number) => {
      const t = stateRef.current.tasks.find((x) => x.id === id);
      if (!t) return;
      if (timerInt.current) clearInterval(timerInt.current);
      const sec = mins * 60;
      setState((s) => ({ ...s, timer: { taskId: id, name: t.name, total: sec, remaining: sec, running: true }, editing: null }));
      timerInt.current = setInterval(tick, 1000);
    },
    [tick]
  );
  const pauseTimer = useCallback(() => {
    setState((s) => {
      if (!s.timer) return s;
      const running = !s.timer.running;
      if (timerInt.current) clearInterval(timerInt.current);
      if (running) timerInt.current = setInterval(tick, 1000);
      return { ...s, timer: { ...s.timer, running } };
    });
  }, [tick]);
  const setTimerMins = useCallback(
    (mins: number) => setState((s) => (s.timer ? { ...s, timer: { ...s.timer, total: mins * 60, remaining: mins * 60 } } : s)),
    []
  );
  const closeTimer = useCallback(() => {
    if (timerInt.current) clearInterval(timerInt.current);
    setState((s) => ({ ...s, timer: null }));
  }, []);

  // --- Завершение дела (дофамин-цепочка) ---
  const completeRef = useRef<(id: string) => void>(() => {});
  const finishTimerRef = useRef<() => void>(() => {});

  const complete = useCallback((id: string) => {
    const s0 = stateRef.current;
    if (s0.celebrating[id] || s0.collapsing[id]) return;
    const t = s0.tasks.find((x) => x.id === id);
    if (!t) return;
    const reward = rewardFn(t, s0.dayOffset);
    const asg = assignee(t, s0);
    const member = asg ? asg.id : s0.me; // в общем доме важно, кто именно закрыл
    const prevLevel = levelOf(s0.totalDone).idx;
    const now = Date.now();
    const combo = now - comboTime.current < COMBO_WINDOW_MS ? comboCount.current + 1 : 1;
    comboTime.current = now;
    comboCount.current = combo;
    sparksTarget.current += reward;
    tweenSparks();
    telegramHaptic('success');

    setState((s) => {
      const ns: AppState = {
        ...s,
        sparks: s.sparks + reward, // источник истины — сразу, анимация отдельно
        celebrating: { ...s.celebrating, [id]: { reward: '+' + reward, combo: combo > 1 ? '×' + combo + ' подряд' : '', stamp: now } },
        plantPop: true,
        maxCombo: Math.max(s.maxCombo, combo),
      };
      if (!s.streakBumped) {
        ns.streak = s.streak + 1;
        ns.streakBumped = true;
      }
      return ns;
    });

    setTimeout(() => {
      if (!dead.current) setState((s) => ({ ...s, plantPop: false }));
    }, 180);
    setTimeout(() => {
      if (!dead.current) setState((s) => ({ ...s, collapsing: { ...s.collapsing, [id]: true } }));
    }, 640);
    setTimeout(() => {
      if (dead.current) return;
      setState((s) => {
        const tasks = s.tasks.map((x) => (x.id === id ? { ...x, lastDay: s.dayOffset } : x));
        const cel = { ...s.celebrating };
        delete cel[id];
        const col = { ...s.collapsing };
        delete col[id];
        const turns = s.members.length ? { ...s.turns, [id]: (s.turns[id] || 0) + 1 } : s.turns;
        const log = trimLog([...s.log, { day: s.dayOffset, member, reward }], s.dayOffset);
        let next = { ...s, tasks, celebrating: cel, collapsing: col, turns, log, totalDone: s.totalDone + 1 };

        // Пост-эффекты на основе нового состояния.
        const cp = overallClean(next.tasks, next.dayOffset);
        if (cp > next.bestClean) next.bestClean = cp;
        const due = computeDue(next.tasks, next.dayOffset);
        const lvl = levelOf(next.totalDone);
        if (lvl.idx > prevLevel) {
          next.levelUpName = lvl.name;
          setTimeout(() => {
            if (!dead.current) setState((s2) => ({ ...s2, levelUpName: null }));
          }, 2600);
        }
        if (due.length === 0) {
          next.showCelebration = true;
        }
        return evalAch(next, true);
      });
    }, 1000);
  }, [tweenSparks, evalAch]);
  completeRef.current = complete;

  const finishTimer = useCallback(() => {
    if (timerInt.current) clearInterval(timerInt.current);
    const tm = stateRef.current.timer;
    // Бонус фокуса +8 — сразу в sparks (истина), твин докрутит отображение.
    setState((s) => ({ ...s, timer: null, sparks: tm ? s.sparks + 8 : s.sparks }));
    if (tm) {
      sparksTarget.current += 8;
      tweenSparks();
      completeRef.current(tm.taskId);
    }
  }, [tweenSparks]);
  finishTimerRef.current = finishTimer;

  const resetAll = useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    const fresh = makeFullInitial();
    sparksTarget.current = fresh.sparks;
    comboTime.current = 0;
    comboCount.current = 0;
    setState(fresh);
  }, []);

  // Онбординг: оставить только выбранные комнаты (и их задачи).
  const completeOnboarding = useCallback((roomIds: string[]) => {
    setState((s) => {
      const rooms = s.rooms.filter((r) => roomIds.includes(r.id));
      const tasks = s.tasks.filter((t) => roomIds.includes(t.roomId));
      return { ...s, rooms, tasks, onboarded: true, expandedRoom: rooms[0]?.id ?? null };
    });
  }, []);

  const actions: Actions = {
    setTab, openEdit, newTask, editPatch, closeEdit, saveEdit, deleteTask, newRoom, patchRoom, closeRoom,
    saveRoom, nextDay, setMode, addMember, removeMember, renameMember, setMe, setFilter, setReminderHour,
    toggleReminder, snooze, toggleExpress, openShop, closeShop, openAch, closeAch, buyEquip, toggleFreeze,
    startTimer, pauseTimer, setTimerMins, closeTimer, finishTimer, complete, toggleRoom, closeCelebration,
    openSoon, closeSoon, resetAll, completeOnboarding, createHome, joinHome, leaveHome,
  };

  return <StoreContext.Provider value={{ state, actions, hydrated }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
