// Карточка дела — ключевой компонент экрана «Сегодня».
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Task } from '../data/types';
import { assignee, maturity } from '../engine/engine';
import { useStore } from '../state/store';
import { colors, fonts, radius, shadows } from '../theme/tokens';
import { ConfettiBurst } from './Confetti';
import { CheckIcon, ClockIcon } from './icons';

export function TaskCard({ task }: { task: Task }) {
  const { state, actions } = useStore();
  const room = state.rooms.find((r) => r.id === task.roomId)!;
  const m = maturity(task, state.dayOffset);
  const overdue = m >= 1.25;
  const asg = assignee(task, state);
  const mine = !!(asg && asg.id === state.me);
  const cel = state.celebrating[task.id];
  const collapsing = !!state.collapsing[task.id];

  // Анимация схлопывания
  const col = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(col, {
      toValue: collapsing ? 1 : 0,
      duration: 360,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  }, [collapsing, col]);

  // Всплывающее «+N»
  const floatY = useRef(new Animated.Value(0)).current;
  const floatOp = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (cel) {
      floatY.setValue(0);
      floatOp.setValue(1);
      Animated.parallel([
        Animated.timing(floatY, { toValue: -48, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatOp, { toValue: 0, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    }
  }, [cel, floatY, floatOp]);

  const maxHeight = col.interpolate({ inputRange: [0, 1], outputRange: [220, 0] });
  const opacity = col.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const scale = col.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] });
  const marginBottom = col.interpolate({ inputRange: [0, 1], outputRange: [11, 0] });

  return (
    <Animated.View style={{ maxHeight, opacity, marginBottom, transform: [{ scale }], overflow: collapsing ? 'hidden' : 'visible' }}>
      <Pressable style={styles.card} onPress={() => actions.openEdit(task.id)}>
        {cel ? <ConfettiBurst /> : null}

        {/* Аватар комнаты + бейдж ответственного */}
        <View style={{ width: 44, height: 44 }}>
          <View style={[styles.avatar, { backgroundColor: room.tint }]}>
            <Text style={{ fontSize: 22 }}>{room.emoji}</Text>
          </View>
          {asg ? (
            <View
              style={[
                styles.asgBadge,
                { backgroundColor: mine ? colors.sageTintBg : colors.avatarTint },
              ]}
            >
              <Text style={{ fontSize: 11 }}>{asg.emoji}</Text>
            </View>
          ) : null}
        </View>

        {/* Текстовый блок */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={styles.name}>
            {task.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.pill, overdue ? styles.pillOverdue : styles.pillDue]}>
              <Text style={[styles.pillText, { color: overdue ? colors.pillOverdueFg : colors.pillDueFg }]}>
                {overdue ? 'просрочено' : 'пора'}
              </Text>
            </View>
            <Text numberOfLines={1} style={styles.roomName}>
              {room.name}
            </Text>
          </View>
          {task.note && task.note.trim() ? (
            <Text numberOfLines={1} style={styles.note}>
              📝 {task.note.trim()}
            </Text>
          ) : null}
        </View>

        {/* Иконка таймера */}
        <Pressable
          onPress={() => actions.startTimer(task.id, 15)}
          hitSlop={8}
          style={{ paddingHorizontal: 2 }}
        >
          <ClockIcon />
        </Pressable>

        {/* Кнопка «Готово» */}
        <Pressable
          onPress={() => actions.complete(task.id)}
          style={[styles.doneBtn, { backgroundColor: cel ? colors.sage : colors.primary }]}
        >
          <CheckIcon />
        </Pressable>

        {/* «+N» / комбо */}
        {cel ? (
          <Animated.View
            pointerEvents="none"
            style={{ position: 'absolute', right: 16, top: 8, alignItems: 'flex-end', opacity: floatOp, transform: [{ translateY: floatY }], zIndex: 4 }}
          >
            <Text style={{ fontFamily: fonts.black, fontSize: 18, color: colors.sparkText }}>{cel.reward} ✨</Text>
            {cel.combo ? <Text style={{ fontFamily: fonts.extrabold, fontSize: 12, color: colors.primary }}>{cel.combo}</Text> : null}
          </Animated.View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.card,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    ...shadows.card,
  },
  avatar: { width: 44, height: 44, borderRadius: radius.avatar, alignItems: 'center', justifyContent: 'center' },
  asgBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 21,
    height: 21,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  name: { fontFamily: fonts.extrabold, fontSize: 15.5, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  pill: { paddingVertical: 2, paddingHorizontal: 9, borderRadius: 999 },
  pillDue: { backgroundColor: colors.pillDueBg },
  pillOverdue: { backgroundColor: colors.pillOverdueBg },
  pillText: { fontFamily: fonts.extrabold, fontSize: 11.5, letterSpacing: 0.2 },
  roomName: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, flexShrink: 1 },
  note: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.textFaint, marginTop: 3 },
  doneBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.doneButton,
  },
});
