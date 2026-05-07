import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from '../HomeScreen';
import { AppStateProvider } from '../../state/AppState';

const Stack = createNativeStackNavigator();

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={{ insets: { top: 0, bottom: 0, left: 0, right: 0 }, frame: { x: 0, y: 0, width: 320, height: 640 } }}>
      <AppStateProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="RoutineDetail" component={() => null as any} />
            <Stack.Screen name="Profile" component={() => null as any} />
            <Stack.Screen name="Settings" component={() => null as any} />
            <Stack.Screen name="Main" component={() => null as any} />
            <Stack.Screen name="CompletionDetail" component={() => null as any} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppStateProvider>
    </SafeAreaProvider>,
  );
}

describe('HomeScreen', () => {
  it('renders a time-of-day greeting', async () => {
    const { findByText } = renderScreen();
    const match = await findByText(/Good (morning|afternoon|evening)\./);
    expect(match).toBeTruthy();
  });

  it('shows the Next Up section with a suggested routine', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('Next Up')).toBeTruthy();
  });

  it('shows the Daily Goal section', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('Daily Goal')).toBeTruthy();
  });

  it('shows 0/goal progress when no completions yet', async () => {
    const { findByText } = renderScreen();
    // Default daily goal is 3, so we should see "0/3"
    expect(await findByText('0/3')).toBeTruthy();
  });
});
