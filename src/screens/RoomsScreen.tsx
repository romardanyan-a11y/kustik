// Экран «Комнаты» — структура дом → комнаты → задачи; аккордеоны.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronIcon } from '../components/icons';
import { ProgressBar } from '../components/ui';
import type { Room } from '../data/types';
import { freqLabel, lastLabel, maturity, overallClean, plural, roomClean, statusDot } from '../engine/engine';
import { useStore } from '../state/store';
import { colors, fonts, radius, shadows } from '../theme/tokens';

export function RoomsScreen() {
  const insets = useSafeAreaInsets();
  const { state, actions } = useStore();
  const cleanPct = Math.round(overallClean(state.tasks, state.dayOffset));

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 18, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ fontFamily: fonts.black, fontSize: 30, color: colors.text }}>Комнаты</Text>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: 2, marginBottom: 16 }}>
        {state.rooms.length} {plural(state.rooms.length, ['комната', 'комнаты', 'комнат'])} · дом чист на {cleanPct}%
      </Text>

      {state.rooms.map((r) => (
        <RoomAccordion key={r.id} room={r} />
      ))}

      <Pressable onPress={actions.newRoom} style={styles.addRoom}>
        <Text style={{ fontFamily: fonts.extrabold, fontSize: 14.5, color: colors.primary }}>+ Добавить комнату</Text>
      </Pressable>
    </ScrollView>
  );
}

function RoomAccordion({ room }: { room: Room }) {
  const { state, actions } = useStore();
  const expanded = state.expandedRoom === room.id;
  const ts = state.tasks
    .filter((t) => t.roomId === room.id)
    .slice()
    .sort((a, b) => maturity(b, state.dayOffset) - maturity(a, state.dayOffset));
  const dueCount = ts.filter((t) => maturity(t, state.dayOffset) >= 1).length;
  const pct = Math.round(roomClean(state.tasks, room.id, state.dayOffset));
  const barColor = pct >= 70 ? colors.sage : pct >= 45 ? colors.honey : colors.primary;

  // Анимация раскрытия + поворот шеврона
  const anim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: expanded ? 1 : 0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();
  }, [expanded, anim]);
  const bodyMax = ts.length * 64 + 70;
  const maxHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [0, bodyMax] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <View style={styles.roomCard}>
      <Pressable onPress={() => actions.toggleRoom(room.id)} style={styles.roomHeader}>
        <View style={[styles.roomAvatar, { backgroundColor: room.tint }]}>
          <Text style={{ fontSize: 23 }}>{room.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 16, color: colors.text }}>{room.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <View style={{ flex: 1 }}>
              <ProgressBar frac={pct / 100} color={barColor} height={7} />
            </View>
            <Text style={{ fontFamily: fonts.extrabold, fontSize: 12, color: colors.textMuted }}>{pct}%</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8, marginLeft: 4 }}>
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 12, color: dueCount > 0 ? colors.primaryDark : colors.sage }}>
            {dueCount > 0 ? `${dueCount} ${plural(dueCount, ['дело', 'дела', 'дел'])} ждут` : 'всё чисто ✨'}
          </Text>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <ChevronIcon />
          </Animated.View>
        </View>
      </Pressable>

      <Animated.View style={{ maxHeight, opacity, overflow: 'hidden' }}>
        <View style={{ paddingHorizontal: 14, paddingBottom: 6 }}>
          {ts.map((t) => {
            const m = maturity(t, state.dayOffset);
            const isDue = m >= 1;
            return (
              <Pressable key={t.id} onPress={() => actions.openEdit(t.id)} style={styles.taskRow}>
                <View style={[styles.dot, { backgroundColor: statusDot(m) }]} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 14.5, color: colors.text }}>{t.name}</Text>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted }}>
                    {freqLabel(t.freq)} · {lastLabel(t, state.dayOffset)}
                  </Text>
                </View>
                <Pressable onPress={() => actions.complete(t.id)} style={isDue ? styles.doBtnDue : styles.doBtnGhost}>
                  <Text style={{ fontFamily: fonts.extrabold, fontSize: 12.5, color: isDue ? colors.pillDueFg : '#94A585' }}>
                    {isDue ? 'Готово' : 'Сделать'}
                  </Text>
                </Pressable>
              </Pressable>
            );
          })}
          <Pressable onPress={() => actions.newTask(room.id)} style={styles.addTask}>
            <Text style={{ fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.primary }}>+ Добавить задачу</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  roomCard: { backgroundColor: '#FFFCF6', borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card, overflow: 'hidden' },
  roomHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  roomAvatar: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(74,55,40,0.06)' },
  dot: { width: 9, height: 9, borderRadius: 999 },
  doBtnDue: { backgroundColor: colors.pillDueBg, borderRadius: 11, paddingVertical: 7, paddingHorizontal: 12 },
  doBtnGhost: { borderWidth: 1.5, borderColor: 'rgba(110,156,99,0.45)', borderRadius: 11, paddingVertical: 6, paddingHorizontal: 11 },
  addTask: { paddingVertical: 12, alignItems: 'center' },
  addRoom: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(197,106,75,0.4)', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
});
