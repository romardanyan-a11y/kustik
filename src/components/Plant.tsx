// «Кустик» — растение-питомец. SVG viewBox 0 0 200 220, параметризуется bloom (0..1).
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { POT_SKINS } from '../data/seed';
import { lerpColor, ss } from '../engine/engine';
import { useTween } from '../hooks/useTween';

const ASvg = Animated.createAnimatedComponent(Svg);

interface PlantProps {
  bloom: number; // 0..1 чистота дома
  potSkin: string;
  outfit: string; // 'none' | 'hat' | 'scarf' | 'glasses'
  levelIdx: number;
  pop: boolean;
  width?: number;
  height?: number;
}

export function Plant({ bloom, potSkin, outfit, levelIdx, pop, width = 188, height = 200 }: PlantProps) {
  const b = useTween(bloom, 600);
  const ssb = ss(b);

  // Покачивание (sway)
  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 2750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 2750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 2750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sway]);

  // «Поп» при завершении
  const popScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (pop) {
      Animated.timing(popScale, { toValue: 1.07, duration: 180, easing: Easing.out(Easing.back(2)), useNativeDriver: true }).start();
    } else {
      Animated.timing(popScale, { toValue: 1, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    }
  }, [pop, popScale]);

  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-1.7deg', '1.7deg'] });

  const leafCol = lerpColor('#AC9A5C', '#6E9C63', ssb);
  const stemCol = lerpColor('#9D876A', '#5E8A4F', ssb);
  const pf = POT_SKINS[potSkin] || POT_SKINS.terracotta;

  // Параметры листа: порог появления и угол.
  const leafProps = (thr: number, rot: number) => {
    const op = ss((b - thr) / 0.16);
    const sc = 0.5 + 0.5 * op;
    return { opacity: op, rotation: rot, scale: sc };
  };
  const flowerScale = (thr: number) => {
    const op = ss((b - thr) / 0.13);
    return { opacity: op, scale: 0.35 + 0.65 * op };
  };

  // Стебель: scaleY вокруг низа (y=150) — считаем путь напрямую.
  const f = 0.5 + 0.5 * b;
  const sy = (y: number) => 150 + (y - 150) * f;
  const stemPath = `M100 150 C 97 ${sy(120)} 103 ${sy(92)} 100 ${sy(60)}`;

  const glowOp = 0.12 + 0.5 * ssb;
  const sparkleOp = ss((b - 0.8) / 0.15);
  const cheekOp = ss((b - 0.6) / 0.22);
  const mouthD = b < 0.3 ? 'M86 191 Q100 183 114 191' : b < 0.62 ? 'M86 189 Q100 191 114 189' : 'M84 186 Q100 198 116 186';

  const leaves: { cx: number; cy: number; rx: number; ry: number; thr: number; rot: number }[] = [
    { cx: 84, cy: 134, rx: 13, ry: 6.5, thr: 0.1, rot: -40 },
    { cx: 116, cy: 134, rx: 13, ry: 6.5, thr: 0.12, rot: 40 },
    { cx: 79, cy: 112, rx: 13, ry: 6.5, thr: 0.28, rot: -30 },
    { cx: 121, cy: 112, rx: 13, ry: 6.5, thr: 0.3, rot: 30 },
    { cx: 82, cy: 90, rx: 12, ry: 6, thr: 0.46, rot: -22 },
    { cx: 118, cy: 90, rx: 12, ry: 6, thr: 0.48, rot: 22 },
    { cx: 89, cy: 69, rx: 11, ry: 5.5, thr: 0.6, rot: -12 },
    { cx: 111, cy: 69, rx: 11, ry: 5.5, thr: 0.62, rot: 12 },
  ];

  const flA = flowerScale(0.64);
  const flB = flowerScale(0.8);
  const flC = flowerScale(0.9);

  const Petals = ({ r, color, center }: { r: number; color: string; center: string }) => (
    <>
      <Circle cx={0} cy={-r * 1.13} r={r} fill={color} />
      <Circle cx={r * 1.07} cy={-r * 0.35} r={r} fill={color} />
      <Circle cx={r * 0.65} cy={r} r={r} fill={color} />
      <Circle cx={-r * 0.65} cy={r} r={r} fill={color} />
      <Circle cx={-r * 1.07} cy={-r * 0.35} r={r} fill={color} />
      <Circle cx={0} cy={0} r={r * 0.78} fill={center} />
    </>
  );

  return (
    <Animated.View style={{ width, height, transform: [{ scale: popScale }] }}>
      <ASvg width={width} height={height} viewBox="0 0 200 220" style={{ overflow: 'visible', transform: [{ rotate }] }}>
        <Defs>
          <RadialGradient id="plantGlow" cx="50%" cy="42%" r="55%">
            <Stop offset="0%" stopColor="#F7E3A4" />
            <Stop offset="55%" stopColor="#EAD6A8" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#EAD6A8" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={100} cy={98} r={94} fill="url(#plantGlow)" opacity={glowOp} />
        <Ellipse cx={100} cy={208} rx={46} ry={7} fill="rgba(74,55,40,0.10)" />

        {/* Искорки при высокой чистоте */}
        <G opacity={sparkleOp}>
          <Path d="M42 58 l2 6.4 6.4 2 -6.4 2 -2 6.4 -2 -6.4 -6.4 -2 6.4 -2 z" fill="#F4C56A" />
          <Path d="M160 72 l1.7 5.4 5.4 1.7 -5.4 1.7 -1.7 5.4 -1.7 -5.4 -5.4 -1.7 5.4 -1.7 z" fill="#ECA0B8" />
          <Path d="M150 40 l1.4 4.4 4.4 1.4 -4.4 1.4 -1.4 4.4 -1.4 -4.4 -4.4 -1.4 4.4 -1.4 z" fill="#F4C56A" />
        </G>

        {/* Стебель */}
        <Path d={stemPath} stroke={stemCol} strokeWidth={5} strokeLinecap="round" fill="none" />

        {/* Листья */}
        {leaves.map((lf, i) => {
          const p = leafProps(lf.thr, lf.rot);
          return (
            <G key={i} originX={lf.cx} originY={lf.cy} rotation={p.rotation} scale={p.scale} opacity={p.opacity}>
              <Ellipse cx={lf.cx} cy={lf.cy} rx={lf.rx} ry={lf.ry} fill={leafCol} stroke="rgba(56,74,42,0.10)" strokeWidth={1} />
            </G>
          );
        })}

        {/* Цветки */}
        <G x={100} y={52} opacity={flA.opacity} originX={100} originY={52} scale={flA.scale}>
          <Petals r={4.6} color="#EC9BB4" center="#F4C56A" />
        </G>
        <G x={85} y={63} opacity={flB.opacity} originX={85} originY={63} scale={flB.scale}>
          <Petals r={4.1} color="#F0B36A" center="#C56A4B" />
        </G>
        <G x={115} y={63} opacity={flC.opacity} originX={115} originY={63} scale={flC.scale}>
          <Petals r={4.1} color="#EC9BB4" center="#F4C56A" />
        </G>

        {/* Аксессуар: бутон (с уровня «Цветик») */}
        <G x={100} y={38} opacity={levelIdx >= 2 ? 1 : 0} originX={100} originY={38} scale={levelIdx >= 2 ? 1 : 0.3}>
          <Petals r={5} color="#F2B5CB" center="#E0A15A" />
        </G>
        {/* Аксессуар: корона (Легенда сада) */}
        <G opacity={levelIdx >= 4 ? 1 : 0} originX={100} originY={46} scale={levelIdx >= 4 ? 1 : 0.4}>
          <G x={74} y={46}>
            <Circle cx={0} cy={0} r={4.4} fill="#ECA0B8" />
            <Circle cx={0} cy={0} r={2} fill="#F4C56A" />
          </G>
          <G x={126} y={46}>
            <Circle cx={0} cy={0} r={4.4} fill="#F0B36A" />
            <Circle cx={0} cy={0} r={2} fill="#C56A4B" />
          </G>
        </G>
        {/* Аксессуар: бабочка (Пышный куст) */}
        <SvgText x={150} y={56} fontSize={21} opacity={levelIdx >= 3 ? 1 : 0}>
          🦋
        </SvgText>

        {/* Горшок */}
        <Path d="M70 150 L130 150 L122 202 Q121 206 117 206 L83 206 Q79 206 78 202 Z" fill={pf[0]} />
        <Path d="M76 152 L83 152 L79 201 L74 200 Z" fill="rgba(255,255,255,0.13)" />
        <Rect x={64} y={143} width={72} height={13} rx={6.5} fill={pf[1]} />

        {/* Лицо */}
        <Circle cx={90} cy={174} r={3.7} fill="#4A3328" />
        <Circle cx={110} cy={174} r={3.7} fill="#4A3328" />
        <Circle cx={80} cy={183} r={5} fill="#E98AA6" opacity={cheekOp} />
        <Circle cx={120} cy={183} r={5} fill="#E98AA6" opacity={cheekOp} />
        <Path d={mouthD} stroke="#4A3328" strokeWidth={2.6} fill="none" strokeLinecap="round" />

        {/* Наряд: очки */}
        <G opacity={outfit === 'glasses' ? 1 : 0}>
          <Circle cx={90} cy={174} r={6.6} fill="rgba(255,255,255,0.25)" stroke="#3A2E26" strokeWidth={2} />
          <Circle cx={110} cy={174} r={6.6} fill="rgba(255,255,255,0.25)" stroke="#3A2E26" strokeWidth={2} />
          <Path d="M96.6 173 L103.4 173" stroke="#3A2E26" strokeWidth={2} />
          <Path d="M83.4 173 L80 171" stroke="#3A2E26" strokeWidth={2} strokeLinecap="round" />
        </G>
        {/* Наряд: шарфик */}
        <G opacity={outfit === 'scarf' ? 1 : 0}>
          <Path d="M66 154 Q100 167 134 154 L134 162 Q100 174 66 162 Z" fill="#5E89A6" />
          <Path d="M123 159 L133 178 L126 179 L118 161 Z" fill="#4E7791" />
        </G>
        {/* Наряд: колпачок */}
        <G opacity={outfit === 'hat' ? 1 : 0}>
          <Path d="M100 113 L114 145 L86 145 Z" fill="#C2553B" />
          <Path d="M84 144 L116 144 L116 149 L84 149 Z" fill="#A8472E" />
          <Circle cx={100} cy={111} r={4} fill="#F4C56A" />
        </G>
        {/* Наряд: бантик (на ободе горшка, справа) */}
        <G opacity={outfit === 'bow' ? 1 : 0}>
          <Path d="M110 149 Q112 141 119 143 Q122 146 120 149 Q122 152 119 155 Q112 157 110 149 Z" fill="#EC9BB4" />
          <Path d="M130 149 Q128 141 121 143 Q118 146 120 149 Q118 152 121 155 Q128 157 130 149 Z" fill="#EC9BB4" />
          <Circle cx={120} cy={149} r={3.2} fill="#E07A9A" />
        </G>
        {/* Наряд: усы (над ртом) */}
        <G opacity={outfit === 'mustache' ? 1 : 0}>
          <Path d="M100 183 Q94 179 89 182 Q85 185 88 187 Q94 189 100 185 Z" fill="#4A3328" />
          <Path d="M100 183 Q106 179 111 182 Q115 185 112 187 Q106 189 100 185 Z" fill="#4A3328" />
        </G>
        {/* Блеск золотого горшка */}
        {potSkin === 'gold' ? (
          <G>
            <Path d="M112 165 l1.6 5 5 1.6 -5 1.6 -1.6 5 -1.6 -5 -5 -1.6 5 -1.6 z" fill="#FFF3C9" opacity={0.9} />
            <Path d="M86 192 l1.1 3.4 3.4 1.1 -3.4 1.1 -1.1 3.4 -1.1 -3.4 -3.4 -1.1 3.4 -1.1 z" fill="#FFF3C9" opacity={0.75} />
          </G>
        ) : null}
      </ASvg>
    </Animated.View>
  );
}
