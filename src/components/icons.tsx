// Линейные SVG-иконки «Кустик» (stroke currentColor, weight ~2).
import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function HomeIcon({ size = 24, color = 'currentColor', strokeWidth = 2.1 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11.5 L12 4.5 L20 11.5 V20 a1 1 0 0 1 -1 1 h-4 v-6 h-6 v6 H5 a1 1 0 0 1 -1 -1 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function RoomsIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x={3.5} y={3.5} width={7} height={7} rx={2.2} />
      <Rect x={13.5} y={3.5} width={7} height={7} rx={2.2} />
      <Rect x={3.5} y={13.5} width={7} height={7} rx={2.2} />
      <Rect x={13.5} y={13.5} width={7} height={7} rx={2.2} />
    </Svg>
  );
}

export function SlidersIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <Line x1={4} y1={7} x2={20} y2={7} />
      <Line x1={4} y1={12} x2={20} y2={12} />
      <Line x1={4} y1={17} x2={20} y2={17} />
      <Circle cx={9} cy={7} r={2.4} fill="#FFFCF6" />
      <Circle cx={15} cy={12} r={2.4} fill="#FFFCF6" />
      <Circle cx={8} cy={17} r={2.4} fill="#FFFCF6" />
    </Svg>
  );
}

export function ClockIcon({ size = 21, color = '#AC916F', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M12 7.5 V12 L15 14" />
    </Svg>
  );
}

export function ChevronIcon({ size = 18, color = '#B7A998', strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 5 L16 12 L9 19" />
    </Svg>
  );
}

export function CheckIcon({ size = 23, color = '#fff', strokeWidth = 3 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12.5 L10 17.5 L19 7" />
    </Svg>
  );
}

export function PlusIcon({ size = 18, color = '#7A6A5B', strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <Line x1={12} y1={5} x2={12} y2={19} />
      <Line x1={5} y1={12} x2={19} y2={12} />
    </Svg>
  );
}

export function MinusIcon({ size = 18, color = '#7A6A5B', strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <Line x1={5} y1={12} x2={19} y2={12} />
    </Svg>
  );
}

export function CloseIcon({ size = 18, color = '#9A8A79', strokeWidth = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <Line x1={6} y1={6} x2={18} y2={18} />
      <Line x1={18} y1={6} x2={6} y2={18} />
    </Svg>
  );
}
