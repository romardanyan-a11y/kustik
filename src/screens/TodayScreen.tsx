// Экран «Сегодня» — состояние дома + что сделать сегодня.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plant } from '../components/Plant';
import { TaskCard } from '../components/TaskCard';
import { SlidersIcon } from '../components/icons';
import { PillChip, ProgressBar, T } from '../components/ui';
import { assignee, computeDue, computeUpcoming, dateLabel, greetingInfo, isSleepy, levelProgress, overallClean, quip, roomClean, upcomingWhen, weatherFor, weeklyStats } from '../engine/engine';
import { useStore } from '../state/store';
import { colors, fonts, radius, shadows } from '../theme/tokens';

export function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { state, actions } = useStore();

  const cleanPct = Math.round(overallClean(state.tasks, state.dayOffset));
  const lvl = levelProgress(state);
  const [greet, greetEmoji] = greetingInfo();
  const sleepy = isSleepy();
  const weather = weatherFor(cleanPct);
  const isMulti = state.members.length > 0;

  let due = computeDue(state.tasks, state.dayOffset);
  if (isMulti && state.filter !== 'all') {
    due = due.filter((t) => {
      const a = assignee(t, state);
      return a && (state.filter === 'mine' ? a.id === state.me : a.id === state.filter);
    });
  }
  const upcoming = computeUpcoming(state.tasks, state.dayOffset);
  const weekly = weeklyStats(state);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 18, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Шапка-приветствие */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.caveatBold, fontSize: 28, color: colors.text }}>
            {greet} {greetEmoji}
          </Text>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 12.5, color: '#90806F', marginTop: 1 }}>{dateLabel()}</Text>
        </View>
        <View style={styles.headerChips}>
          <View style={[styles.chip, { backgroundColor: colors.streakChipBg, borderColor: colors.streakChipBorder }]}>
            <Text style={{ fontFamily: fonts.extrabold, fontSize: 13, color: colors.streakText }}>🔥 {state.streak}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.sparkChipBg, borderColor: colors.sparkChipBorder }]}>
            <Text style={{ fontFamily: fonts.extrabold, fontSize: 13, color: colors.sparkText }}>✨ {state.sparksDisplay}</Text>
          </View>
          <Pressable onPress={() => actions.setTab('settings')} style={styles.roundBtn}>
            <SlidersIcon size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Кнопка «Гости на пороге» */}
      <Pressable onPress={actions.toggleExpress} style={styles.guestBtn}>
        <Text style={{ fontSize: 18 }}>🔔</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 14, color: colors.primaryDeep }}>Скоро гости?</Text>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 11.5, color: '#A56B4F' }}>Экспресс-уборка — самое заметное за 15 минут</Text>
        </View>
        <Text style={{ fontSize: 18, color: colors.primary }}>→</Text>
      </Pressable>

      {/* Растение-индикатор */}
      <View style={styles.plantWrap}>
        <View style={{ position: 'absolute', top: 4, right: 6, zIndex: 2 }}>
          <Text style={{ fontSize: 26 }}>{weather}</Text>
        </View>
        {sleepy ? (
          <View style={{ position: 'absolute', top: 38, left: 56, zIndex: 2, opacity: 0.7 }}>
            <Text style={{ fontSize: 19 }}>💤</Text>
          </View>
        ) : null}
        <Plant bloom={cleanPct / 100} potSkin={state.potSkin} outfit={state.outfit} levelIdx={levelIndex(state)} pop={state.plantPop} />
        <Text style={styles.cleanCaption}>чистота дома</Text>
        <Text style={styles.cleanNumber}>
          {cleanPct}
          <Text style={{ fontSize: 24 }}>%</Text>
        </Text>
        <Text style={styles.quip}>{sleepy ? 'Кустик задремал — дела спокойно ждут до утра' : quip(cleanPct)}</Text>

        {/* Бейдж уровня */}
        <View style={styles.levelPill}>
          <Text style={{ fontSize: 15 }}>{lvl.emoji}</Text>
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.text }}>{lvl.name}</Text>
          <View style={styles.levelNum}>
            <Text style={{ fontFamily: fonts.extrabold, fontSize: 11, color: '#fff' }}>{lvl.num}</Text>
          </View>
        </View>
        <View style={{ marginTop: 8, alignItems: 'center' }}>
          <ProgressBar frac={lvl.frac} color={colors.sage} width={170} height={5} />
          <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: colors.textFaint, marginTop: 5 }}>{lvl.toNextLabel}</Text>
        </View>
      </View>

      {/* Лента фильтров */}
      {isMulti ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }} style={{ marginBottom: 14 }}>
          <PillChip label="Все" selected={state.filter === 'all'} onPress={() => actions.setFilter('all')} />
          <PillChip label="Мои дела" selected={state.filter === 'mine'} onPress={() => actions.setFilter('mine')} />
          {state.members.map((m) => (
            <PillChip key={m.id} label={m.name} emoji={m.emoji} selected={state.filter === m.id} onPress={() => actions.setFilter(m.id)} />
          ))}
        </ScrollView>
      ) : null}

      {/* «Пора сегодня» */}
      <View style={styles.sectionRow}>
        <Text style={{ fontFamily: fonts.black, fontSize: 18, color: colors.text }}>Пора сегодня</Text>
        <View style={styles.countBadge}>
          <Text style={{ fontFamily: fonts.black, fontSize: 13, color: '#fff' }}>{due.length}</Text>
        </View>
      </View>

      {due.length > 0 ? (
        due.map((t) => <TaskCard key={t.id} task={t} />)
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ fontFamily: fonts.caveatBold, fontSize: 24, color: colors.sageDark }}>Всё чисто! 🎉</Text>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
            Сегодня делать нечего — кустик отдыхает
          </Text>
        </View>
      )}

      {/* «На подходе» */}
      {upcoming.length > 0 ? (
        <View style={{ marginTop: 22 }}>
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 14, color: colors.textFaint, marginBottom: 10, letterSpacing: 0.3 }}>НА ПОДХОДЕ</Text>
          {upcoming.map((t) => {
            const room = state.rooms.find((r) => r.id === t.roomId)!;
            return (
              <Pressable key={t.id} onPress={() => actions.openEdit(t.id)} style={styles.upcomingCard}>
                <View style={[styles.upAvatar, { backgroundColor: room.tint }]}>
                  <Text style={{ fontSize: 18 }}>{room.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 14.5, color: colors.text }}>{t.name}</Text>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted }}>{room.name}</Text>
                </View>
                <Text style={{ fontFamily: fonts.extrabold, fontSize: 13, color: '#8C9A66' }}>{upcomingWhen(t, state.dayOffset)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* Итог недели */}
      <View style={styles.weekCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: fonts.black, fontSize: 16, color: colors.text }}>Итог недели</Text>
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 13, color: colors.streakText }}>🔥 серия {weekly.streak}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <WeekTile big={`${weekly.count}`} label={`${weekly.countLabel} за неделю`} />
          <WeekTile big={`${weekly.best.emoji}`} label={`чище всех · ${weekly.best.name}`} />
          <WeekTile big={`${weekly.worst.emoji}`} label={`просит внимания · ${weekly.worst.name}`} />
        </View>
        {weekly.isMulti ? (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontFamily: fonts.extrabold, fontSize: 12.5, color: colors.textFaint, marginBottom: 8 }}>ВКЛАД ЗА НЕДЕЛЮ</Text>
            {weekly.memberStats.map((ms) => (
              <View key={ms.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <Text style={{ fontSize: 15 }}>{ms.emoji}</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.text, width: 54 }}>{ms.name}</Text>
                <View style={{ flex: 1 }}>
                  <ProgressBar frac={ms.frac} color={ms.color} height={8} />
                </View>
                <Text style={{ fontFamily: fonts.extrabold, fontSize: 12.5, color: colors.sparkText, width: 46, textAlign: 'right' }}>✨ {ms.sparks}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* Демо-ссылка */}
      <Pressable onPress={actions.nextDay} style={{ alignSelf: 'center', marginTop: 20, padding: 8 }}>
        <T style={{ fontSize: 12.5, color: colors.textPale }}>↻ промотать день вперёд · демо</T>
      </Pressable>
    </ScrollView>
  );
}

function WeekTile({ big, label }: { big: string; label: string }) {
  return (
    <View style={styles.weekTile}>
      <Text style={{ fontFamily: fonts.black, fontSize: 22, color: colors.text }}>{big}</Text>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 10.5, color: colors.textMuted, textAlign: 'center', marginTop: 3 }}>{label}</Text>
    </View>
  );
}

// Индекс уровня (для аксессуаров растения).
function levelIndex(state: ReturnType<typeof useStore>['state']) {
  const tiers = [6, 14, 26, 45, Infinity];
  const n = state.log.length;
  return tiers.findIndex((m) => n < m);
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  headerChips: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  chip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
  roundBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5E0CF',
    borderWidth: 1,
    borderColor: 'rgba(197,106,75,0.2)',
    borderRadius: 15,
    padding: 13,
    marginBottom: 18,
  },
  plantWrap: { alignItems: 'center', marginBottom: 18 },
  cleanCaption: { fontFamily: fonts.extrabold, fontSize: 11.5, color: '#A2917E', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: -8 },
  cleanNumber: { fontFamily: fonts.black, fontSize: 46, color: colors.text, marginTop: 1, lineHeight: 50 },
  quip: { fontFamily: fonts.caveatSemibold, fontSize: 19, color: '#B05A38', marginTop: 2, textAlign: 'center', paddingHorizontal: 20 },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFCF6',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 5,
    paddingLeft: 12,
    paddingRight: 5,
    marginTop: 12,
  },
  levelNum: { backgroundColor: colors.sage, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 },
  countBadge: { backgroundColor: colors.primary, borderRadius: 999, minWidth: 24, height: 24, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 36 },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(74,55,40,0.18)',
    backgroundColor: 'rgba(255,252,246,0.55)',
    borderRadius: radius.card,
    padding: 11,
    marginBottom: 9,
  },
  upAvatar: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  weekCard: { backgroundColor: '#FBF4EA', borderRadius: 18, padding: 16, marginTop: 22, borderWidth: 1, borderColor: colors.borderSoft },
  weekTile: { flex: 1, backgroundColor: '#FFFCF6', borderRadius: 13, paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', borderWidth: 1, borderColor: colors.borderSoft },
});
