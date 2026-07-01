// Ловит ошибки рендера и показывает их на экране (важно для отладки в Telegram,
// где иначе виден просто пустой экран).
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

interface State {
  error: Error | null;
  info: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    this.setState({ info: info.componentStack || '' });
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#F8EFE0' }} contentContainerStyle={{ padding: 24, paddingTop: 80 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#BB4F32', marginBottom: 12 }}>Кустик споткнулся 🪴</Text>
          <Text style={{ fontSize: 14, color: '#3A2E26', marginBottom: 8 }}>{String(this.state.error?.message || this.state.error)}</Text>
          <Text selectable style={{ fontSize: 11, color: '#90806F' }}>{this.state.info.slice(0, 1500)}</Text>
        </ScrollView>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
