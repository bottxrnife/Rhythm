import React, { Component, ErrorInfo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';
import { Button } from './Button';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <MaterialIcons name="error-outline" size={48} color={colors.outline} />
          <Text style={[typography.headlineMd, { color: colors.onSurface, textAlign: 'center' }]}>
            Something went wrong
          </Text>
          <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center', maxWidth: 280 }]}>
            The app ran into an unexpected problem. Try again, and if it keeps
            happening, restart the app.
          </Text>
          <Button label="Try Again" onPress={this.handleReset} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.marginPage,
    gap: spacing.stackLg,
  },
});
