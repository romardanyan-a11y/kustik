// «Кустик» — приложение для домашней уборки «по чуть-чуть». Корень.
import {
  Caveat_500Medium,
  Caveat_600SemiBold,
  Caveat_700Bold,
} from '@expo-google-fonts/caveat';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { initTelegram, setTelegramBackButton } from './src/telegram/telegram';
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
import { RoomsScreen } from './src/screens/RoomsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { StoreProvider, useStore } from './src/state/store';
import { colors } from './src/theme/tokens';

function Root() {
  const { state, actions } = useStore();

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

  return (
    <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={{ flex: 1 }}>
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
  const [loaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Caveat_500Medium,
    Caveat_600SemiBold,
    Caveat_700Bold,
  });

  // Инициализация Telegram Mini App (no-op вне Telegram).
  useEffect(() => {
    initTelegram();
  }, []);

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgTop, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
