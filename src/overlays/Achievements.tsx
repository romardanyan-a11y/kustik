// Достижения (bottom-sheet) — сетка бейджей.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '../components/Sheet';
import { achievements } from '../engine/engine';
import { useStore } from '../state/store';
import { colors, fonts } from '../theme/tokens';

export function Achievements() {
  const { state, actions } = useStore();
  // Достижение открыто навсегда, если зафиксировано в achUnlocked
  // (условие «сейчас истинно» тоже учитываем — до ближайшей фиксации).
  const list = achievements(state).map((a) => ({
    ...a,
    unlocked: a.unlocked || state.achUnlocked[a.key] != null,
  }));
  const count = list.filter((a) => a.unlocked).length;

  return (
    <BottomSheet visible={state.achOpen} onClose={actions.closeAch}>
      <Text style={styles.title}>🏅 Достижения</Text>
      <Text style={styles.sub}>Открыто {count} из {list.length}</Text>
      <View style={styles.grid}>
        {list.map((a) => (
          <View key={a.key} style={[styles.tile, { backgroundColor: a.unlocked ? '#FBF4EA' : '#F1EBE0', borderColor: a.unlocked ? 'rgba(110,156,99,0.35)' : colors.borderSoft, opacity: a.unlocked ? 1 : 0.55 }]}>
            <Text style={{ fontSize: 26, opacity: a.unlocked ? 1 : 0.45 }}>{a.unlocked ? a.emoji : '🔒'}</Text>
            <Text style={{ fontFamily: fonts.extrabold, fontSize: 12.5, color: colors.text, marginTop: 6, textAlign: 'center' }}>{a.name}</Text>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 10.5, color: colors.textMuted, marginTop: 2, textAlign: 'center' }}>{a.desc}</Text>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.black, fontSize: 21, color: colors.text, textAlign: 'center' },
  sub: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '47%', borderRadius: 14, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center' },
});
