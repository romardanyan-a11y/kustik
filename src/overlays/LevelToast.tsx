// Тост нового уровня — пилюля сверху-центр, авто-скрытие.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../state/store';
import { colors, fonts, shadows } from '../theme/tokens';

export function LevelToast() {
  const { state } = useStore();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  // Приоритет: уровень > достижение > квест > инфо.
  const text = state.levelUpName
    ? `🎉 Новый уровень: ${state.levelUpName}`
    : state.achToast
    ? `🏅 Достижение: ${state.achToast}`
    : state.questToast || state.infoToast || null;
  const visible = !!text;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, bounciness: 12, speed: 12 }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }).start();
    }
  }, [visible, anim]);

  if (!visible) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { top: insets.top + 8, opacity: anim, transform: [{ translateY }] }]}
    >
      <Text style={{ fontFamily: fonts.extrabold, fontSize: 14, color: '#fff' }}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.sageDark,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    zIndex: 50,
    ...shadows.toast,
  },
});
