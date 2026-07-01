// Празднование «Дом сияет!» — конфетти-дождь, когда закрыты все дела дня.
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ConfettiRain } from '../components/Confetti';
import { useStore } from '../state/store';
import { colors, fonts, shadows } from '../theme/tokens';

export function Celebration() {
  const { state, actions } = useStore();
  if (!state.showCelebration) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={actions.closeCelebration} statusBarTranslucent>
      <View style={styles.backdrop}>
        <ConfettiRain count={48} />
        <View style={styles.card}>
          <Text style={{ fontSize: 52 }}>🌷</Text>
          <Text style={styles.title}>Дом сияет!</Text>
          <Text style={styles.sub}>Все дела на сегодня закрыты. Кустик в полном восторге!</Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statBig}>🔥 {state.streak}</Text>
              <Text style={styles.statLabel}>серия</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statBig}>✨ {state.sparks}</Text>
              <Text style={styles.statLabel}>искры</Text>
            </View>
          </View>
          <Pressable onPress={actions.closeCelebration} style={styles.btn}>
            <Text style={{ fontFamily: fonts.black, fontSize: 16, color: '#fff' }}>Красота! 🎉</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,12,6,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  card: { backgroundColor: colors.sheet, borderRadius: 26, padding: 28, alignItems: 'center', width: '100%', maxWidth: 340, ...shadows.modal },
  title: { fontFamily: fonts.caveatBold, fontSize: 36, color: colors.primaryDeep, marginTop: 6 },
  sub: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: 6 },
  stats: { flexDirection: 'row', gap: 28, marginVertical: 20 },
  stat: { alignItems: 'center' },
  statBig: { fontFamily: fonts.black, fontSize: 22, color: colors.text },
  statLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  btn: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 15, borderRadius: 15, backgroundColor: colors.primary },
});
