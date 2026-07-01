// Нижний таб-бар.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tab } from '../data/types';
import { useStore } from '../state/store';
import { colors, fonts } from '../theme/tokens';
import { HomeIcon, RoomsIcon, SlidersIcon } from './icons';

const ITEMS: { key: Tab; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'rooms', label: 'Комнаты' },
  { key: 'settings', label: 'Настройки' },
];

export function TabBar() {
  const insets = useSafeAreaInsets();
  const { state, actions } = useStore();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) + 8 }]}>
      {ITEMS.map((it) => {
        const active = state.tab === it.key;
        const color = active ? colors.tabActive : colors.tabInactive;
        return (
          <Pressable key={it.key} onPress={() => actions.setTab(it.key)} style={styles.item}>
            {it.key === 'today' && <HomeIcon size={24} color={color} />}
            {it.key === 'rooms' && <RoomsIcon size={24} color={color} />}
            {it.key === 'settings' && <SlidersIcon size={24} color={color} />}
            <Text style={{ fontFamily: active ? fonts.extrabold : fonts.semibold, fontSize: 11, color }}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
    paddingTop: 7,
    paddingHorizontal: 24,
  },
  item: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
});
