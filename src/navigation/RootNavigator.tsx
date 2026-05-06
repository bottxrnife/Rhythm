import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import {
  WelcomeScreen,
  RoutineDetailScreen,
  CaptureScreen,
  VerifyingScreen,
  VerifiedScreen,
  AlmostScreen,
  SponsorsScreen,
  SettingsScreen,
  ProfileScreen,
  CompletionDetailScreen,
} from '../screens';
import { useAppState } from '../state/AppState';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { hasOnboarded, isLoading } = useAppState();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={hasOnboarded ? 'Main' : 'Welcome'}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="RoutineDetail"
        component={RoutineDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Capture"
        component={CaptureScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="Verifying"
        component={VerifyingScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="Verified"
        component={VerifiedScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="Almost"
        component={AlmostScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="Sponsors"
        component={SponsorsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="CompletionDetail"
        component={CompletionDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
