// «Кустик» — приложение для домашней уборки «по чуть-чуть». Корень.
// Subpath-импорты шрифтов: в бандл попадают только нужные начертания
// (корневой импорт пакета тащит все 20+ ttf, включая италики).
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat/600SemiBold';
import { Caveat_700Bold } from '@expo-google-fonts/caveat/700Bold';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { BG_THEMES } from './src/data/seed';
import { getStartParam, initTelegram, setTelegramBackButton } from './src/telegram/telegram';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TabBar } from './src/components/TabBar';
import { Achievements } from './src/overlays/Achievements';
import { Celebration } from './src/overlays/Celebration';
import { Express } from './src/overlays/Express';
import { FocusTimer } from './src/overlays/FocusTimer';
import { LevelToast } from './src/overlays/LevelToast';
import { NewRoom } from './src/overlays/NewRoom';
import { Shop } from './src/overlays/Shop';
import { TaskEditor } from './src/overlays/TaskEditor';
import { Onboarding } from './src/screens/Onboarding';
import { RoomsScreen } from './src/screens/RoomsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { StoreProvider, useStore } from './src/state/store';
import { colors } from './src/theme/tokens';

function Root() {
  const { state, actions, hydrated } = useStore();
  const bg = BG_THEMES[state.bgTheme] || BG_THEMES.classic;

  // Системная кнопка «Назад» Telegram закрывает верхний открытый лист/оверлей.
  const overlayCloser =
    state.timer
      ? actions.closeTimer
      : state.showCelebration
      ? actions.closeCelebration
      : state.shopOpen
      ? actions.closeShop
      : state.achOpen
      ? actions.closeAch
      : state.editing
      ? actions.closeEdit
      : state.editingRoom
      ? actions.closeRoom
      : state.express
      ? actions.toggleExpress
      : null;

  useEffect(() => {
    return setTelegramBackButton(!!overlayCloser, () => overlayCloser?.());
  }, [overlayCloser]);

  // Приглашение в общий дом: t.me/бот?startapp=h_<homeId>.
  useEffect(() => {
    if (!hydrated) return;
    const sp = getStartParam();
    if (sp && sp.startsWith('h_')) actions.joinHome(sp.slice(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Ждём загрузку сейва, чтобы онбординг не мигал у вернувшихся.
  if (!hydrated) {
    return <LinearGradient colors={bg} style={{ flex: 1 }} />;
  }

  // Первый запуск — онбординг вместо всего интерфейса.
  if (!state.onboarded) {
    return (
      <LinearGradient colors={bg} style={{ flex: 1 }}>
        <Onboarding />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={bg} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {state.tab === 'today' && <TodayScreen />}
        {state.tab === 'rooms' && <RoomsScreen />}
        {state.tab === 'settings' && <SettingsScreen />}
      </View>
      <TabBar />

      {/* Оверлеи / листы */}
      <TaskEditor />
      <NewRoom />
      <Express />
      <Shop />
      <Achievements />
      <FocusTimer />
      <Celebration />
      <LevelToast />
    </LinearGradient>
  );
}

export default function App() {
  const [loaded, error] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Caveat_600SemiBold,
    Caveat_700Bold,
  });

  // Не блокируем приложение навсегда, если шрифты почему-то не грузятся
  // (актуально для in-app браузера Telegram): максимум 2.5с спиннера.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Инициализация Telegram Mini App (no-op вне Telegram).
  useEffect(() => {
    initTelegram();
  }, []);

  const ready = loaded || timedOut || !!error;
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgTop, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <StoreProvider>
          <Root />
        </StoreProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
