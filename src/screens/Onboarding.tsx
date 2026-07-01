// Онбординг: 3 шага — знакомство, как это работает, выбор комнат.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plant } from '../components/Plant';
import { SEED_ROOMS } from '../data/seed';
import { useStore } from '../state/store';
import { colors, fonts, radius, shadows } from '../theme/tokens';

export function Onboarding() {
  const insets = useSafeAreaInsets();
  const { actions } = useStore();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SEED_ROOMS.map((r) => [r.id, true]))
  );
  const pickedIds = SEED_ROOMS.filter((r) => picked[r.id]).map((r) => r.id);
  const canStart = pickedIds.length > 0;

  const next = () => {
    if (step < 2) setStep(step + 1);
    else if (canStart) actions.completeOnboarding(pickedIds);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 16) + 12 }}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <>
            <Plant bloom={0.78} potSkin="terracotta" outfit="none" levelIdx={0} pop={false} />
            <Text style={styles.hello}>Привет, я Кустик!</Text>
            <Text style={styles.text}>
              Я цвету, когда дома чисто, и грущу, когда всё запущено.{'\n'}Помогай мне по чуть-чуть — каждый день.
            </Text>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={{ fontSize: 54, marginBottom: 8 }}>🌱</Text>
            <Text style={styles.hello}>Без списков-простыней</Text>
            <Text style={styles.text}>
              У каждого дела своя частота: посуда — каждый день, душ — раз в неделю.{'\n\n'}
              Каждый день я показываю только то, что <Text style={{ fontFamily: fonts.extrabold }}>пора сделать</Text> —
              самое запущенное сверху.{'\n\n'}
              Пропустишь день? Ничего не сгорит — назавтра в списке просто на пару дел больше.
            </Text>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.hello}>Собери свой дом</Text>
            <Text style={[styles.text, { marginBottom: 18 }]}>Какие комнаты убираем? Задачи внутри я уже приготовил — потом подправишь.</Text>
            {SEED_ROOMS.map((r) => {
              const on = !!picked[r.id];
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setPicked((p) => ({ ...p, [r.id]: !p[r.id] }))}
                  style={[styles.roomRow, { borderColor: on ? colors.sage : 'rgba(74,55,40,0.12)', backgroundColor: on ? '#F3F7EE' : colors.surface }]}
                >
                  <View style={[styles.roomAvatar, { backgroundColor: r.tint }]}>
                    <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.extrabold, fontSize: 15.5, color: colors.text, flex: 1 }}>{r.name}</Text>
                  <View style={[styles.checkbox, { backgroundColor: on ? colors.sage : 'transparent', borderColor: on ? colors.sage : 'rgba(74,55,40,0.2)' }]}>
                    {on ? <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Точки-индикатор + кнопка */}
      <View style={{ paddingHorizontal: 24 }}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === step ? colors.primary : 'rgba(74,55,40,0.15)', width: i === step ? 22 : 7 }]} />
          ))}
        </View>
        <Pressable
          onPress={next}
          disabled={step === 2 && !canStart}
          style={[styles.btn, { backgroundColor: step === 2 && !canStart ? '#DCC9B8' : colors.primary }]}
        >
          <Text style={{ fontFamily: fonts.black, fontSize: 16, color: '#fff' }}>
            {step < 2 ? 'Дальше' : 'Начать 🌱'}
          </Text>
        </Pressable>
        {step > 0 ? (
          <Pressable onPress={() => setStep(step - 1)} style={{ alignItems: 'center', marginTop: 12, padding: 4 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 13.5, color: colors.textMuted }}>Назад</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 16 },
  hello: { fontFamily: fonts.caveatBold, fontSize: 38, color: colors.primaryDeep, marginTop: 10, textAlign: 'center' },
  text: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 9,
    ...shadows.card,
  },
  roomAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 14 },
  dot: { height: 7, borderRadius: 999 },
  btn: { borderRadius: 15, paddingVertical: 15, alignItems: 'center', ...shadows.saveButton },
});
