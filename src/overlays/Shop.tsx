// Магазинчик (bottom-sheet) — горшки и наряды.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { BottomSheet } from '../components/Sheet';
import { FIT_ITEMS, POT_ITEMS, POT_SKINS } from '../data/seed';
import type { ShopItem } from '../data/types';
import { useStore } from '../state/store';
import { colors, fonts } from '../theme/tokens';
import { Pressable } from 'react-native';

export function Shop() {
  const { state, actions } = useStore();

  const renderTile = (it: ShopItem, equippedVal: string) => {
    const owned = !!state.owned[it.id];
    const equipped = equippedVal === it.val;
    const can = owned || state.sparks >= it.cost;
    const status = equipped ? 'Надето' : owned ? 'Надеть' : `✨ ${it.cost}`;
    return (
      <Pressable
        key={it.id}
        onPress={() => can && actions.buyEquip(it)}
        style={[
          styles.tile,
          {
            borderColor: equipped ? colors.sage : 'rgba(74,55,40,0.1)',
            backgroundColor: equipped ? '#EAF0E2' : colors.surface,
            opacity: can ? 1 : 0.5,
          },
        ]}
      >
        {it.kind === 'pot' ? <PotPreview skin={it.val} /> : <Text style={{ fontSize: 30 }}>{it.emoji}</Text>}
        <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.text, marginTop: 6 }}>{it.name}</Text>
        <Text style={{ fontFamily: fonts.extrabold, fontSize: 11.5, color: equipped ? colors.sageDark : owned ? colors.textMuted : colors.sparkText, marginTop: 2 }}>
          {status}
        </Text>
      </Pressable>
    );
  };

  return (
    <BottomSheet visible={state.shopOpen} onClose={actions.closeShop}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={styles.title}>🛍️ Магазинчик</Text>
        <View style={styles.balance}>
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 14, color: colors.sparkText }}>✨ {state.sparks}</Text>
        </View>
      </View>

      <Text style={styles.section}>Горшок</Text>
      <View style={styles.grid}>{POT_ITEMS.map((it) => renderTile(it, state.potSkin))}</View>

      <Text style={[styles.section, { marginTop: 18 }]}>Наряд</Text>
      <View style={styles.grid}>{FIT_ITEMS.map((it) => renderTile(it, state.outfit))}</View>
    </BottomSheet>
  );
}

function PotPreview({ skin }: { skin: string }) {
  const pf = POT_SKINS[skin] || POT_SKINS.terracotta;
  return (
    <Svg width={40} height={36} viewBox="60 140 80 70">
      <Path d="M70 150 L130 150 L122 202 Q121 206 117 206 L83 206 Q79 206 78 202 Z" fill={pf[0]} />
      <Rect x={64} y={143} width={72} height={13} rx={6.5} fill={pf[1]} />
      <Circle cx={90} cy={174} r={3.7} fill="#4A3328" />
      <Circle cx={110} cy={174} r={3.7} fill="#4A3328" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.black, fontSize: 21, color: colors.text },
  balance: { backgroundColor: colors.sparkChipBg, borderWidth: 1, borderColor: colors.sparkChipBorder, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  section: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.textFaint, marginBottom: 10, letterSpacing: 0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '30.5%', borderRadius: 14, borderWidth: 2, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center' },
});
