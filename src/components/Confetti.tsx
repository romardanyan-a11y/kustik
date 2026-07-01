// Конфетти: всплеск из карточки при завершении и дождь при празднике.
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View, ViewStyle } from 'react-native';

const CARD_COLORS = ['#C56A4B', '#6E9C63', '#E0A15A', '#ECA0B8', '#5E9C92', '#F4C56A'];
const RAIN_COLORS = ['#C56A4B', '#6E9C63', '#E0A15A', '#ECA0B8', '#5E9C92', '#F4C56A', '#fff'];

interface Piece {
  left: string;
  top: string;
  size: number;
  color: string;
  round: boolean;
  dx: number;
  dy: number;
  rot: number;
  delay: number;
  dur: number;
}

function PieceView({ p, anchor }: { p: Piece; anchor: 'burst' | 'rain' }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: p.dur,
      delay: p.delay,
      easing: anchor === 'burst' ? Easing.bezier(0.18, 0.7, 0.32, 1) : Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [t, p, anchor]);

  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] });
  const opacity = t.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });

  const style: Animated.WithAnimatedObject<ViewStyle> = {
    position: 'absolute',
    left: p.left as ViewStyle['left'],
    top: p.top as ViewStyle['top'],
    width: p.size,
    height: p.size * 1.35,
    backgroundColor: p.color,
    borderRadius: p.round ? p.size : 2,
    transform: [{ translateX }, { translateY }, { rotate }],
    opacity,
  };
  return <Animated.View pointerEvents="none" style={style} />;
}

export function ConfettiBurst({ count = 14 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(() => {
    const out: Piece[] = [];
    for (let i = 0; i < count; i++) {
      const ang = (-90 + (Math.random() * 120 - 60)) * (Math.PI / 180);
      const dist = 42 + Math.random() * 64;
      out.push({
        left: `${44 + Math.random() * 24}%`,
        top: '46%',
        size: 5 + Math.random() * 5,
        color: CARD_COLORS[i % CARD_COLORS.length],
        round: Math.random() < 0.5,
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist - 8,
        rot: Math.random() * 620 - 310,
        delay: Math.random() * 50,
        dur: 820,
      });
    }
    return out;
  }, [count]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 3 }}>
      {pieces.map((p, i) => (
        <PieceView key={i} p={p} anchor="burst" />
      ))}
    </View>
  );
}

export function ConfettiRain({ count = 48 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(() => {
    const out: Piece[] = [];
    for (let i = 0; i < count; i++) {
      out.push({
        left: `${Math.random() * 100}%`,
        top: '-10%',
        size: 6 + Math.random() * 7,
        color: RAIN_COLORS[i % RAIN_COLORS.length],
        round: Math.random() < 0.5,
        dx: Math.random() * 70 - 35,
        dy: 420 + Math.random() * 260,
        rot: Math.random() * 720 - 360,
        delay: Math.random() * 400,
        dur: 1200 + Math.random() * 900,
      });
    }
    return out;
  }, [count]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      {pieces.map((p, i) => (
        <PieceView key={i} p={p} anchor="rain" />
      ))}
    </View>
  );
}
