// Редактор задачи (bottom-sheet).
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet } from '../components/Sheet';
import { Chip, Stepper } from '../components/ui';
import { FREQ_PRESETS } from '../data/seed';
import { plural } from '../engine/engine';
import { useStore } from '../state/store';
import { colors, fonts } from '../theme/tokens';

export function TaskEditor() {
  const { state, actions } = useStore();
  const e = state.editing;
  const visible = !!e;

  return (
    <BottomSheet visible={visible} onClose={actions.closeEdit}>
      {e ? (
        <>
          <Text style={styles.title}>{e.isNew ? 'Новая задача' : 'Изменить задачу'}</Text>

          <Field label="Название">
            <TextInput
              value={e.name}
              onChangeText={(v) => actions.editPatch({ name: v })}
              placeholder="Что делаем?"
              placeholderTextColor={colors.textPale}
              style={styles.input}
            />
          </Field>

          <Field label="Заметка">
            <TextInput
              value={e.note}
              onChangeText={(v) => actions.editPatch({ note: v })}
              placeholder="Необязательно"
              placeholderTextColor={colors.textPale}
              style={styles.input}
            />
          </Field>

          <Field label="Комната">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {state.rooms.map((r) => (
                <Chip key={r.id} label={r.name} emoji={r.emoji} selected={e.roomId === r.id} onPress={() => actions.editPatch({ roomId: r.id })} />
              ))}
            </ScrollView>
          </Field>

          <Field label="Как часто">
            <View style={styles.chipWrap}>
              {FREQ_PRESETS.map((p) => (
                <Chip key={p.v} label={p.label} selected={e.freq === p.v} onPress={() => actions.editPatch({ freq: p.v })} />
              ))}
            </View>
            <View style={[styles.sub, { marginTop: 12 }]}>
              <Text style={styles.subLabel}>Своя частота</Text>
              <Stepper
                label={`${e.freq} ${plural(e.freq, ['день', 'дня', 'дней'])}`}
                onMinus={() => actions.editPatch({ freq: Math.max(1, e.freq - 1) })}
                onPlus={() => actions.editPatch({ freq: Math.min(120, e.freq + 1) })}
              />
            </View>
          </Field>

          <Field label="Последний раз">
            <View style={styles.sub}>
              <Stepper
                label={e.lastAgo <= 0 ? 'сегодня' : `${e.lastAgo} ${plural(e.lastAgo, ['день', 'дня', 'дней'])} назад`}
                onMinus={() => actions.editPatch({ lastAgo: Math.max(0, e.lastAgo - 1) })}
                onPlus={() => actions.editPatch({ lastAgo: e.lastAgo + 1 })}
              />
              <Pressable onPress={() => actions.editPatch({ lastAgo: 0 })} style={styles.todayBtn}>
                <Text style={{ fontFamily: fonts.extrabold, fontSize: 13, color: colors.sageDark }}>Сегодня</Text>
              </Pressable>
            </View>
          </Field>

          {!e.isNew ? (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <Pressable onPress={() => e.id && actions.startTimer(e.id, 15)} style={[styles.actionBtn, { backgroundColor: '#F3DBCB' }]}>
                <Text style={{ fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.primaryDeep }}>🎯 Фокус · 15 мин</Text>
              </Pressable>
              <Pressable onPress={actions.snooze} style={[styles.actionBtn, { backgroundColor: '#EAE2D4' }]}>
                <Text style={{ fontFamily: fonts.extrabold, fontSize: 13.5, color: '#7A6A5B' }}>😴 До завтра</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable
            onPress={actions.saveEdit}
            disabled={!e.name.trim()}
            style={[styles.saveBtn, { backgroundColor: e.name.trim() ? colors.primary : '#DCC9B8' }]}
          >
            <Text style={{ fontFamily: fonts.black, fontSize: 16, color: '#fff' }}>Сохранить</Text>
          </Pressable>

          {!e.isNew ? (
            <Pressable onPress={actions.deleteTask} style={{ alignItems: 'center', marginTop: 14, padding: 6 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 13.5, color: colors.rust }}>Удалить задачу</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </BottomSheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.black, fontSize: 21, color: colors.text, textAlign: 'center', marginBottom: 4 },
  fieldLabel: { fontFamily: fonts.extrabold, fontSize: 12.5, color: colors.textFaint, marginBottom: 8, letterSpacing: 0.3 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(74,55,40,0.12)',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  chipRow: { gap: 8, paddingVertical: 2 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sub: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  todayBtn: { backgroundColor: colors.sageTintBg, borderRadius: 11, paddingVertical: 9, paddingHorizontal: 14 },
  actionBtn: { flex: 1, alignItems: 'center', borderRadius: 13, paddingVertical: 13 },
  saveBtn: { marginTop: 22, borderRadius: 15, paddingVertical: 15, alignItems: 'center' },
});
