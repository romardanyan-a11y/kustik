// Таймер «Фокус-уборка» (полноэкранный центр).
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useStore } from '../state/store';
import { colors, fonts, shadows } from '../theme/tokens';

const R = 52;
const C = 2 * Math.PI * R; // ≈ 326.726

export function FocusTimer() {
  const { state, actions } = useStore();
  const tm = state.timer;
  if (!tm) return null;

  const mm = Math.floor(tm.remaining / 60);
  const sec = tm.remaining % 60;
  const timeStr = `${mm}:${sec < 10 ? '0' : ''}${sec}`;
  const prog = tm.total ? 1 - tm.remaining / tm.total : 0;
  const dashOffset = C * (1 - prog);
  const curMin = Math.round(tm.total / 60);

  return (
    <Modal transparent visible animationType="fade" onRequestClose={actions.closeTimer} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.name} numberOfLines={2}>{tm.name}</Text>

          <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginVertical: 18 }}>
            <Svg width={200} height={200} viewBox="0 0 120 120">
              <Circle cx={60} cy={60} r={R} stroke="rgba(74,55,40,0.10)" strokeWidth={9} fill="none" />
              <Circle
                cx={60}
                cy={60}
                r={R}
                stroke={colors.primary}
                strokeWidth={9}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${C} ${C}`}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 60 60)"
              />
            </Svg>
            <View style={{ position: 'absolute' }}>
              <Text style={{ fontFamily: fonts.black, fontSize: 40, color: colors.text }}>{timeStr}</Text>
            </View>
          </View>

          <View style={styles.presets}>
            {[5, 15, 25].map((mn) => {
              const sel = curMin === mn;
              return (
                <Pressable key={mn} onPress={() => actions.setTimerMins(mn)} style={[styles.preset, { borderColor: sel ? colors.primary : 'rgba(74,55,40,0.12)', backgroundColor: sel ? colors.primary : colors.surface }]}>
                  <Text style={{ fontFamily: fonts.extrabold, fontSize: 13, color: sel ? '#fff' : '#7A6A5B' }}>{mn} мин</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={actions.pauseTimer} style={styles.pauseBtn}>
            <Text style={{ fontFamily: fonts.extrabold, fontSize: 15, color: colors.text }}>{tm.running ? 'Пауза' : 'Продолжить'}</Text>
          </Pressable>

          <Pressable onPress={actions.finishTimer} style={styles.finishBtn}>
            <Text style={{ fontFamily: fonts.black, fontSize: 16, color: '#fff' }}>Готово ✓</Text>
          </Pressable>

          <Pressable onPress={actions.closeTimer} style={{ marginTop: 12, padding: 6 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 13.5, color: colors.textMuted }}>Свернуть</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,12,6,0.62)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  card: { backgroundColor: colors.sheet, borderRadius: 26, padding: 26, alignItems: 'center', width: '100%', maxWidth: 360, ...shadows.modal },
  name: { fontFamily: fonts.black, fontSize: 18, color: colors.text, textAlign: 'center' },
  presets: { flexDirection: 'row', gap: 8, alignSelf: 'stretch', marginBottom: 16 },
  preset: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, borderWidth: 1.5 },
  pauseBtn: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(74,55,40,0.14)', backgroundColor: colors.surface, marginBottom: 10 },
  finishBtn: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 15, borderRadius: 15, backgroundColor: colors.sage },
});
