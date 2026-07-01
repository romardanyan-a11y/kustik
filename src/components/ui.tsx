// Базовые UI-примитивы «Кустик».
import React from 'react';
import { Pressable, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';
import { MinusIcon, PlusIcon } from './icons';

// Текст с дефолтным шрифтом Nunito.
export function T({ style, ...rest }: TextProps) {
  return <Text {...rest} style={[{ fontFamily: fonts.regular, color: colors.text }, style]} />;
}

// Выбираемый чип (как chipStyle в прототипе).
export function Chip({
  label,
  emoji,
  selected,
  onPress,
}: {
  label: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 13,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : 'rgba(74,55,40,0.12)',
        backgroundColor: selected ? colors.primary : colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
      }}
    >
      {emoji ? <Text style={{ fontSize: 14 }}>{emoji}</Text> : null}
      <Text style={{ fontFamily: fonts.bold, fontSize: 13.5, color: selected ? '#fff' : '#6B5B4D' }}>{label}</Text>
    </Pressable>
  );
}

// Пилюля фильтра/режима (со скруглением 999).
export function PillChip({
  label,
  emoji,
  selected,
  onPress,
}: {
  label: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : 'rgba(74,55,40,0.12)',
        backgroundColor: selected ? colors.primary : colors.surface,
      }}
    >
      {emoji ? <Text style={{ fontSize: 13 }}>{emoji}</Text> : null}
      <Text style={{ fontFamily: fonts.extrabold, fontSize: 13, color: selected ? '#fff' : '#7A6A5B' }}>{label}</Text>
    </Pressable>
  );
}

// Степпер: − значение +
export function Stepper({
  label,
  onMinus,
  onPlus,
}: {
  label: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} style={styles.stepBtn} hitSlop={6}>
        <MinusIcon />
      </Pressable>
      <Text style={{ fontFamily: fonts.extrabold, fontSize: 14, color: colors.text, minWidth: 96, textAlign: 'center' }}>
        {label}
      </Text>
      <Pressable onPress={onPlus} style={styles.stepBtn} hitSlop={6}>
        <PlusIcon />
      </Pressable>
    </View>
  );
}

// Тумблер.
export function Toggle({ value, onToggle, activeColor }: { value: boolean; onToggle: () => void; activeColor?: string }) {
  return (
    <Pressable
      onPress={onToggle}
      style={{
        width: 52,
        height: 30,
        borderRadius: 999,
        backgroundColor: value ? activeColor || colors.sage : '#D8C9B8',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 3,
          left: value ? 25 : 3,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#fff',
          ...styles.knobShadow,
        }}
      />
    </Pressable>
  );
}

// Прогресс-бар.
export function ProgressBar({
  frac,
  color,
  height = 5,
  width = '100%',
  track = 'rgba(74,55,40,0.08)',
}: {
  frac: number;
  color: string;
  height?: number;
  width?: ViewStyle['width'];
  track?: string;
}) {
  return (
    <View style={{ width, height, borderRadius: 999, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, frac)) * 100}%`, height: '100%', borderRadius: 999, backgroundColor: color }} />
    </View>
  );
}

// Заголовок секции (settings).
export function SectionLabel({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return (
    <Text style={[{ fontFamily: fonts.extrabold, fontSize: 12, color: colors.textFaint, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(74,55,40,0.10)',
    padding: 4,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F4EDE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  knobShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
