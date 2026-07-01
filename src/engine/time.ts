// Реальное время. «День» — целочисленный индекс локальных суток.
// Вся математика движка (daysSince/maturity) работает на этих индексах:
// dayOffset состояния = todayIndex(), lastDay задач — индексы дней выполнения.

// Индекс текущих суток по ЛОКАЛЬНОЙ полуночи пользователя.
export function todayIndex(): number {
  const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
  return Math.floor((Date.now() - tzOffsetMs) / 86400000);
}

// Debug-режим: показывает демо-кнопку «промотать день».
// Включается ?debug в URL (web) или в dev-сборке.
export function isDebug(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    try {
      return new URLSearchParams(window.location.search).has('debug');
    } catch {
      return false;
    }
  }
  return false;
}
