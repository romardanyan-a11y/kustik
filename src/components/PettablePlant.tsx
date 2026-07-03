// Кустик, которого можно погладить: тап → сердечки/искорки взлетают + бонс + хаптик.
import React, { useCallback, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { telegramHaptic } from '../telegram/telegram';
import { Plant } from './Plant';

const HEARTS = ['💚', '✨', '🌿', '💛', '🥰', '🌸'];

interface FloatHeart {
  key: string;
  emoji: string;
  left: number;
  anim: Animated.Value;
}

interface Props {
  bloom: number;
  potSkin: string;
  outfit: string;
  levelIdx: number;
  pop: boolean;
  width?: number;
  height?: number;
}

export function PettablePlant(props: Props) {
  const [hearts, setHearts] = useState<FloatHeart[]>([]);
  const patScale = useRef(new Animated.Value(1)).current;
  const seq = useRef(0);

  const pat = useCallback(() => {
    telegramHaptic('light');
    // Бонс-сжатие.
    Animated.sequence([
      Animated.timing(patScale, { toValue: 0.94, duration: 90, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.spring(patScale, { toValue: 1, friction: 3.5, tension: 140, useNativeDriver: true }),
    ]).start();

    // Пара взлетающих сердечек.
    const n = 2 + Math.floor(Math.random() * 2);
    const fresh: FloatHeart[] = [];
    for (let i = 0; i < n; i++) {
      const anim = new Animated.Value(0);
      const h: FloatHeart = {
        key: `h${seq.current++}`,
        emoji: HEARTS[Math.floor(Math.random() * HEARTS.length)],
        left: 30 + Math.random() * 40, // % ширины
        anim,
      };
      fresh.push(h);
      Animated.timing(anim, { toValue: 1, duration: 1000 + Math.random() * 400, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(
        () => {
          setHearts((prev) => prev.filter((x) => x.key !== h.key));
        }
      );
    }
    setHearts((prev) => [...prev, ...fresh].slice(-12));
  }, [patScale]);

  const w = props.width ?? 188;
  const h = props.height ?? 200;

  return (
    <View style={{ width: w, height: h }}>
      <Animated.View style={{ transform: [{ scale: patScale }] }}>
        <Pressable onPress={pat} accessibilityRole="button" accessibilityLabel="Погладить кустик">
          <Plant {...props} />
        </Pressable>
      </Animated.View>

      {/* Взлетающие сердечки */}
      {hearts.map((ht) => {
        const translateY = ht.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -90] });
        const opacity = ht.anim.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] });
        const scale = ht.anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 1.1, 0.9] });
        return (
          <Animated.View
            key={ht.key}
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: h * 0.4,
              left: `${ht.left}%`,
              opacity,
              transform: [{ translateY }, { scale }],
            }}
          >
            <Text style={{ fontSize: 22 }}>{ht.emoji}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}
