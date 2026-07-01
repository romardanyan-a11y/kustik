// Дизайн-токены «Кустик» — единый источник цветов, радиусов, теней, шрифтов.
// Дублирует значения из seed.json / хэндоффа.

export const colors = {
  // Фоны
  bgTop: '#F8EFE0',
  bgBottom: '#F2E7D3',
  underlayInner: '#F2E7D5',
  underlayOuter: '#E6D6BE',
  surface: '#FFFCF6',
  sheet: '#FBF4EA',

  // Текст
  text: '#3A2E26',
  textMuted: '#90806F',
  textFaint: '#A2917E',
  textPale: '#B7A998',

  // Терракота (primary)
  primary: '#C56A4B',
  primaryDark: '#A8543A',
  primaryDeep: '#B05A38',
  rust: '#BB4F32',

  // Сейдж (успех / чисто)
  sage: '#6E9C63',
  sageDark: '#5E8A4F',
  sageTintBg: '#E9F0E1',
  sageTintBorder: '#9CC182',

  // Хани / охра (искры)
  honey: '#DC9A52',
  honey2: '#E0A15A',
  sparkText: '#9C7A2E',
  streakText: '#C9772F',

  // Голубой (заморозка)
  blue: '#5E89A6',
  blueDark: '#4E7791',

  // Пилюли статусов
  pillDueBg: '#F3DBCB',
  pillDueFg: '#B05A38',
  pillOverdueBg: '#F6DCD2',
  pillOverdueFg: '#BB4F32',

  // Чипы шапки
  streakChipBg: '#FFF1E2',
  streakChipBorder: '#F2D9C0',
  sparkChipBg: '#F2EEDC',
  sparkChipBorder: '#E4DCBE',

  // Бордеры / разделители
  border: 'rgba(74,55,40,0.10)',
  borderSoft: 'rgba(74,55,40,0.07)',
  borderStrong: 'rgba(74,55,40,0.13)',
  divider: 'rgba(74,55,40,0.07)',

  // Таб-бар
  tabActive: '#C56A4B',
  tabInactive: '#AB9C8A',
  tabBarBg: 'rgba(251,244,234,0.94)',
  tabBarBorder: 'rgba(74,55,40,0.08)',

  // Прочее
  avatarTint: '#F2EADF',
  white: '#FFFFFF',
  scrim: 'rgba(40,27,17,0.36)',
};

export const radius = {
  pill: 999,
  button: 13,
  buttonLg: 14,
  card: 18,
  tile: 14,
  avatar: 14,
  sheetTop: 28,
};

export const fonts = {
  // Имена соответствуют ключам, под которыми грузятся шрифты в App.tsx
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
  caveatMedium: 'Caveat_500Medium',
  caveatSemibold: 'Caveat_600SemiBold',
  caveatBold: 'Caveat_700Bold',
};

// Тени (в RN тени задаются иначе — собираем готовые объекты).
import { Platform } from 'react-native';

const shadow = (color: string, opacity: number, radiusV: number, dy: number, elevation: number) =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radiusV,
      shadowOffset: { width: 0, height: dy },
    },
    android: { elevation },
    default: {},
  }) as object;

export const shadows = {
  card: shadow('#785A37', 0.12, 10, 2, 3),
  doneButton: shadow('#783C1E', 0.18, 0, 2, 2),
  sheet: shadow('#281B11', 0.2, 22, -12, 16),
  modal: shadow('#140C06', 0.4, 30, 24, 24),
  saveButton: shadow('#C56A4B', 0.3, 16, 5, 6),
  toast: shadow('#1E3517', 0.35, 14, 6, 8),
  small: shadow('#000000', 0.2, 3, 1, 2),
};
