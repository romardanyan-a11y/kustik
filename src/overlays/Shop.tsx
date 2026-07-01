// Магазинчик (bottom-sheet) — горшки и наряды.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheet } from '../components/Sheet';
import { BG_ITEMS, BG_THEMES, FIT_ITEMS, POT_ITEMS, POT_SKINS, PREMIUM_ITEMS } from '../data/seed';
import type { ShopItem } from '../data/types';
import { useStore } from '../state/store';
import { getInitData } from '../telegram/telegram';
import { colors, fonts } from '../theme/tokens';
import { Pressable } from 'react-native';

export function Shop() {
  const { state, actions } = useStore();

  const renderPreview = (it: ShopItem) => {
    if (it.kind === 'pot') return <PotPreview skin={it.val} />;
    if (it.kind === 'bg') {
      const g = BG_THEMES[it.val] || BG_THEMES.classic;
      return (
        <LinearGradient
          colors={g}
          style={{ width: 40, height: 36, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(74,55,40,0.12)' }}
        />
      );
    }
    return <Text style={{ fontSize: 30 }}>{it.emoji}</Text>;
  };

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
        {renderPreview(it)}
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

      <Text style={[styles.section, { marginTop: 18 }]}>Фон</Text>
      <View style={styles.grid}>{BG_ITEMS.map((it) => renderTile(it, state.bgTheme))}</View>

      {/* Премиум за Telegram Stars (только внутри Telegram) */}
      {getInitData() || PREMIUM_ITEMS.some((it) => state.owned[it.id]) ? (
        <>
          <Text style={[styles.section, { marginTop: 18 }]}>Премиум · Telegram Stars</Text>
          <View style={styles.grid}>
            {PREMIUM_ITEMS.map((it) => {
              const owned = !!state.owned[it.id];
              const equipped = (it.kind === 'pot' ? state.potSkin : state.outfit) === it.val;
              const status = equipped ? 'Надето' : owned ? 'Надеть' : `⭐ ${it.cost}`;
              return (
                <Pressable
                  key={it.id}
                  onPress={() => actions.buyPremium(it)}
                  style={[
                    styles.tile,
                    styles.premiumTile,
                    {
                      borderColor: equipped ? colors.sage : '#E4C266',
                      backgroundColor: equipped ? '#EAF0E2' : '#FFF9E8',
                    },
                  ]}
                >
                  {it.kind === 'pot' ? <PotPreview skin={it.val} /> : <Text style={{ fontSize: 30 }}>{it.emoji}</Text>}
                  <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.text, marginTop: 6 }}>{it.name}</Text>
                  <Text style={{ fontFamily: fonts.extrabold, fontSize: 11.5, color: equipped ? colors.sageDark : owned ? colors.textMuted : '#B8860B', marginTop: 2 }}>
                    {status}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
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
  premiumTile: { shadowColor: '#D9A441', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
});
