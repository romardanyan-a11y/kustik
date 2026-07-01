// Bottom-sheet и центральный модал «Кустик».
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, radius, shadows } from '../theme/tokens';

const { height: SCREEN_H } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  scroll?: boolean;
  zIndex?: number;
}

export function BottomSheet({ visible, onClose, children, scroll = true }: BottomSheetProps) {
  const slide = useRef(new Animated.Value(SCREEN_H)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 340, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }),
      ]).start();
    }
  }, [visible, fade, slide]);

  if (!visible) return null;

  const inner = (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 34 }}>
      <View style={styles.handle} />
      {children}
    </View>
  );

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slide }] }]}>
        {scroll ? (
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false}>
            {inner}
          </ScrollView>
        ) : (
          inner
        )}
      </Animated.View>
    </Modal>
  );
}

interface CenterModalProps {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  blur?: boolean;
  dismissable?: boolean;
}

export function CenterModal({ visible, onClose, children, dismissable = true }: CenterModalProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 480, easing: Easing.bezier(0.2, 1.2, 0.35, 1), useNativeDriver: true }),
      ]).start();
    } else {
      fade.setValue(0);
      scale.setValue(0.9);
    }
  }, [visible, fade, scale]);

  if (!visible) return null;
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.centerBackdrop, { opacity: fade }]}>
        {dismissable && <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />}
        <Animated.View style={{ transform: [{ scale }], width: '100%', alignItems: 'center' }}>{children}</Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '90%',
    backgroundColor: colors.sheet,
    borderTopLeftRadius: radius.sheetTop,
    borderTopRightRadius: radius.sheetTop,
    ...shadows.sheet,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(74,55,40,0.18)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  centerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,12,6,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
});
