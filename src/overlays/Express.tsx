// Экспресс «Гости на пороге» (bottom-sheet) — самое заметное, отранжировано по видимости.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '../components/Sheet';
import { computeExpress } from '../engine/engine';
import { useStore } from '../state/store';
import { colors, fonts, radius, shadows } from '../theme/tokens';

export function Express() {
  const { state, actions } = useStore();
  const list = computeExpress(state.tasks, state.dayOffset);

  return (
    <BottomSheet visible={state.express} onClose={actions.toggleExpress}>
      <Text style={styles.title}>🔔 Гости на пороге</Text>
      <Text style={styles.sub}>Самое заметное — пройдись по списку сверху вниз</Text>
      {list.map((t) => {
        const room = state.rooms.find((r) => r.id === t.roomId)!;
        return (
          <View key={t.id} style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: room.tint }]}>
              <Text style={{ fontSize: 20 }}>{room.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 14.5, color: colors.text }}>{t.name}</Text>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted }}>{room.name}</Text>
            </View>
            <Pressable onPress={() => actions.complete(t.id)} style={styles.doneBtn}>
              <Text style={{ fontFamily: fonts.extrabold, fontSize: 13, color: colors.pillDueFg }}>Готово</Text>
            </Pressable>
          </View>
        );
      })}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.black, fontSize: 21, color: colors.text, textAlign: 'center' },
  sub: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface, borderRadius: 14, padding: 11, marginBottom: 9, borderWidth: 1, borderColor: colors.borderSoft },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  doneBtn: { backgroundColor: colors.pillDueBg, borderRadius: 11, paddingVertical: 8, paddingHorizontal: 14 },
});
