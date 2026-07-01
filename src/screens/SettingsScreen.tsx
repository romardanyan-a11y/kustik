// Экран «Настройки» — режим, участники, напоминание, заморозка, магазин, достижения.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseIcon } from '../components/icons';
import { SectionLabel, Stepper, Toggle } from '../components/ui';
import { achievements } from '../engine/engine';
import { useStore } from '../state/store';
import { getInitData, openTelegramLink } from '../telegram/telegram';
import { colors, fonts, radius, shadows } from '../theme/tokens';
import type { Mode } from '../data/types';

const BOT_USERNAME = 'KustikCleaner_bot';

const MODES: { label: string; v: Mode }[] = [
  { label: 'Один', v: 'one' },
  { label: 'Вдвоём', v: 'duo' },
  { label: 'Семья', v: 'family' },
];

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { state, actions } = useStore();
  const isMulti = state.members.length > 0;
  const inHome = !!state.homeId;

  const invite = () => {
    if (!state.homeId) return;
    const link = `https://t.me/${BOT_USERNAME}?startapp=h_${state.homeId}`;
    const text = 'Заходи в наш общий дом в Кустике — будем убираться по чуть-чуть вместе 🌱';
    openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
  };
  const achList = achievements(state);
  const achCount = achList.filter((a) => a.unlocked || state.achUnlocked[a.key] != null).length;
  const achTotal = achList.length;
  const modeHint =
    state.mode === 'one'
      ? 'Все дела — твои. Просто и спокойно.'
      : state.mode === 'duo'
      ? 'Дела делятся на двоих по очереди — честно и без споров.'
      : 'Дела распределяются между всеми по очереди.';

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 18, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ fontFamily: fonts.black, fontSize: 30, color: colors.text, marginBottom: 18 }}>Настройки</Text>

      {/* Совместный дом (только внутри Telegram — там есть подписанный initData) */}
      {getInitData() || inHome ? (
        <View style={styles.block}>
          <SectionLabel>Совместный дом</SectionLabel>
          {inHome ? (
            <>
              {state.members.map((m) => (
                <View key={m.id} style={styles.memberRow}>
                  <View style={[styles.memberAvatar, { borderColor: m.color }]}>
                    <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                  </View>
                  <Text style={[styles.nameInput, { paddingVertical: 8 }]}>{m.name}</Text>
                  {m.id === state.me ? (
                    <View style={[styles.meChip, styles.meChipActive]}>
                      <Text style={{ fontFamily: fonts.extrabold, fontSize: 11, color: colors.sageDark }}>это ты</Text>
                    </View>
                  ) : null}
                </View>
              ))}
              <Pressable onPress={invite} style={styles.inviteBtn}>
                <Text style={{ fontFamily: fonts.black, fontSize: 15, color: '#fff' }}>🔗 Пригласить в дом</Text>
              </Pressable>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 11.5, color: colors.textMuted, marginTop: 10, textAlign: 'center' }}>
                Дела, кустик и искры — общие. Дела распределяются по очереди.
              </Text>
              <Pressable onPress={actions.leaveHome} style={{ alignItems: 'center', marginTop: 10, padding: 4 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 12.5, color: colors.rust }}>Выйти из дома</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>
                Убирайтесь вместе: общий кустик, общие дела, честная очередь. Партнёру ничего не нужно устанавливать.
              </Text>
              <Pressable onPress={actions.createHome} disabled={state.homeBusy} style={[styles.inviteBtn, state.homeBusy && { opacity: 0.6 }]}>
                <Text style={{ fontFamily: fonts.black, fontSize: 15, color: '#fff' }}>
                  {state.homeBusy ? 'Создаю…' : '🏠 Создать общий дом'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}

      {/* Режим (локальный — недоступен в общем доме, там всё по-настоящему) */}
      {!inHome ? (
      <View style={styles.block}>
        <SectionLabel>Режим</SectionLabel>
        <View style={styles.segment}>
          {MODES.map((o) => {
            const active = state.mode === o.v;
            return (
              <Pressable key={o.v} onPress={() => actions.setMode(o.v)} style={[styles.segItem, active && styles.segItemActive]}>
                <Text style={{ fontFamily: fonts.extrabold, fontSize: 14, color: active ? colors.primary : '#9A8A79' }}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textMuted, marginTop: 10 }}>{modeHint}</Text>
      </View>
      ) : null}

      {/* Кто убирается (локальные участники; в общем доме — реальные люди выше) */}
      {!inHome && isMulti ? (
        <View style={styles.block}>
          <SectionLabel>Кто убирается</SectionLabel>
          {state.members.map((m) => {
            const isMe = m.id === state.me;
            return (
              <View key={m.id} style={styles.memberRow}>
                <View style={[styles.memberAvatar, { borderColor: m.color }]}>
                  <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                </View>
                <TextInput
                  value={m.name}
                  onChangeText={(v) => actions.renameMember(m.id, v)}
                  style={styles.nameInput}
                  placeholder="Имя"
                  placeholderTextColor={colors.textPale}
                />
                <Pressable onPress={() => actions.setMe(m.id)} style={[styles.meChip, isMe && styles.meChipActive]}>
                  <Text style={{ fontFamily: fonts.extrabold, fontSize: 11, color: isMe ? colors.sageDark : colors.textFaint }}>это я</Text>
                </Pressable>
                {state.members.length > 2 ? (
                  <Pressable onPress={() => actions.removeMember(m.id)} hitSlop={8} style={{ padding: 4 }}>
                    <CloseIcon size={16} />
                  </Pressable>
                ) : null}
              </View>
            );
          })}
          {state.mode === 'family' && state.members.length < 5 ? (
            <Pressable onPress={actions.addMember} style={styles.addMember}>
              <Text style={{ fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.primary }}>+ Добавить человека</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Напоминание */}
      <View style={styles.block}>
        <SectionLabel>Напоминание</SectionLabel>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Каждый день</Text>
          <Toggle value={state.reminderOn} onToggle={actions.toggleReminder} />
        </View>
        {state.reminderOn ? (
          <View style={[styles.settingRow, { marginTop: 12 }]}>
            <Text style={styles.settingLabel}>Во сколько</Text>
            <Stepper
              label={`${state.reminderHour < 10 ? '0' : ''}${state.reminderHour}:00`}
              onMinus={() => actions.setReminderHour(state.reminderHour - 1)}
              onPlus={() => actions.setReminderHour(state.reminderHour + 1)}
            />
          </View>
        ) : null}
      </View>

      {/* Заморозка серии */}
      <View style={styles.block}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>🧊 Заморозка серии · ×{state.freezes}</Text>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 11.5, color: colors.textMuted, marginTop: 3 }}>
              Пропустишь день — серия не сгорит
            </Text>
          </View>
          <Toggle value={state.autoFreeze} onToggle={actions.toggleFreeze} activeColor={colors.blue} />
        </View>
      </View>

      {/* Кустик */}
      <View style={styles.block}>
        <SectionLabel>Кустик</SectionLabel>
        <Pressable onPress={actions.openShop} style={styles.linkRow}>
          <Text style={styles.settingLabel}>🛍️ Магазинчик</Text>
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 13, color: colors.sparkText }}>✨ {state.sparks} →</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable onPress={actions.openAch} style={styles.linkRow}>
          <Text style={styles.settingLabel}>🏅 Достижения</Text>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted }}>Открыто {achCount} из {achTotal} →</Text>
        </Pressable>
      </View>

      <Pressable onPress={actions.resetAll} style={{ alignSelf: 'center', marginTop: 8, padding: 8 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: colors.textPale }}>Сбросить прогресс</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: '#FFFCF6', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card },
  segment: { flexDirection: 'row', backgroundColor: '#F0E7DA', borderRadius: 13, padding: 4, gap: 4 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 },
  segItemActive: { backgroundColor: '#FFFCF6', ...shadows.small },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.avatarTint, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  nameInput: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.text, paddingVertical: 4 },
  meChip: { borderWidth: 1.5, borderColor: 'rgba(74,55,40,0.14)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9 },
  meChipActive: { borderColor: colors.sageTintBorder, backgroundColor: colors.sageTintBg },
  addMember: { paddingVertical: 8, alignItems: 'center' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.text },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 8 },
  inviteBtn: { backgroundColor: colors.sage, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
});
