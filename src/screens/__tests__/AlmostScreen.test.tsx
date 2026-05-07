import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlmostScreen } from '../AlmostScreen';
import { AppStateProvider } from '../../state/AppState';
import type { RoutineData } from '../../navigation/types';

const Stack = createNativeStackNavigator();

const ROUTINE: RoutineData = {
  id: 'hydrate',
  title: 'Hydrate',
  description: 'Drink a glass of water.',
  icon: 'water-drop',
  category: 'Hygiene',
  credits: '+2.50',
  steps: ['Open bottle', 'Drink'],
  verifyHint: 'Checks for drinking.',
  sponsored: true,
  sponsorName: 'Liquid Death',
};

function renderWithParams(params: any) {
  return render(
    <SafeAreaProvider initialMetrics={{ insets: { top: 0, bottom: 0, left: 0, right: 0 }, frame: { x: 0, y: 0, width: 320, height: 640 } }}>
      <AppStateProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Almost"
              component={AlmostScreen}
              initialParams={params}
            />
            <Stack.Screen name="Capture" component={() => null as any} />
            <Stack.Screen name="Main" component={() => null as any} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppStateProvider>
    </SafeAreaProvider>,
  );
}

describe('AlmostScreen', () => {
  it('displays the provided short reason in sentence case', async () => {
    const { findByText } = renderWithParams({
      routine: ROUTINE,
      videoUri: 'file:///tmp/x.mp4',
      shortReason: 'could not detect cup',
    });
    // Should be capitalized but still present
    expect(await findByText(/Could not detect cup/)).toBeTruthy();
  });

  it('falls back to a generic phrase when shortReason is missing', async () => {
    const { findByText } = renderWithParams({
      routine: ROUTINE,
      videoUri: undefined,
    });
    expect(await findByText(/Could not clearly verify the routine/)).toBeTruthy();
  });

  it('renders both recovery actions', async () => {
    const { findByText } = renderWithParams({
      routine: ROUTINE,
      videoUri: 'file:///tmp/x.mp4',
      shortReason: 'no person visible',
    });
    expect(await findByText('Try again')).toBeTruthy();
    expect(await findByText('Self-verify (no reward)')).toBeTruthy();
  });

  it('strips trailing periods from short reason', async () => {
    const { findByText } = renderWithParams({
      routine: ROUTINE,
      shortReason: 'product label unreadable.',
    });
    const node = await findByText(/Product label unreadable/);
    expect(node.props.children).not.toMatch(/\.$/);
  });
});
