// Новая комната (bottom-sheet).
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet } from '../components/Sheet';
import { ROOM_EMOJI_CHOICES } from '../data/seed';
import { useStore } from '../state/store';
import { colors, fonts } from '../theme/tokens';

export function NewRoom() {
  const { state, actions } = useStore();
  const e = state.editingRoom;
  const visible = !!e;

  return (
    <BottomSheet visible={visible} onClose={actions.closeRoom}>
      {e ? (
        <>
          <Text style={styles.title}>Новая комната</Text>
          <Text style={styles.label}>Название</Text>
          <TextInput
            value={e.name}
            onChangeText={(v) => actions.patchRoom({ name: v })}
            placeholder="Например, Балкон"
            placeholderTextColor={colors.textPale}
            style={styles.input}
          />
          <Text style={[styles.label, { marginTop: 16 }]}>Иконка</Text>
          <View style={styles.grid}>
            {ROOM_EMOJI_CHOICES.map((em) => {
              const sel = e.emoji === em;
              return (
                <Pressable
                  key={em}
                  onPress={() => actions.patchRoom({ emoji: em })}
                  style={[styles.emojiTile, { backgroundColor: sel ? '#F3DBCB' : colors.surface, borderColor: sel ? colors.primary : 'rgba(74,55,40,0.10)' }]}
                >
                  <Text style={{ fontSize: 24 }}>{em}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={actions.saveRoom}
            disabled={!e.name.trim()}
            style={[styles.saveBtn, { backgroundColor: e.name.trim() ? colors.primary : '#DCC9B8' }]}
          >
            <Text style={{ fontFamily: fonts.black, fontSize: 16, color: '#fff' }}>Добавить комнату</Text>
          </Pressable>
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.black, fontSize: 21, color: colors.text, textAlign: 'center', marginBottom: 14 },
  label: { fontFamily: fonts.extrabold, fontSize: 12.5, color: colors.textFaint, marginBottom: 8 },
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emojiTile: { width: '21%', aspectRatio: 1, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { marginTop: 22, borderRadius: 15, paddingVertical: 15, alignItems: 'center' },
});
