/**
 * Simulated end-to-end of the verification navigation flow — exercises the
 * VerifyingScreen's routing based on verification results, without a real
 * server. We stub out verification.ts and assert navigation outcomes.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import type { RoutineData } from '../../navigation/types';

// Stub the verification service so we can control outcomes deterministically.
jest.mock('../../services/verification', () => ({
  verifyRoutine: jest.fn(),
}));

import { verifyRoutine } from '../../services/verification';
import { VerifyingScreen } from '../VerifyingScreen';

const Stack = createNativeStackNavigator();

const ROUTINE: RoutineData = {
  id: 'hydrate',
  title: 'Hydrate',
  description: 'Drink water.',
  icon: 'water-drop',
  category: 'Hygiene',
  credits: '+2.50',
  steps: ['a', 'b', 'c'],
  verifyHint: 'nova checks...',
  sponsored: true,
  sponsorName: 'Liquid Death',
};

function StubScreen({ route }: any) {
  // Record the route params into a ref-like JSON dump we can grep from the DOM.
  return (
    <View>
      <Text>STUB:{route.name}:{JSON.stringify(route.params)}</Text>
    </View>
  );
}

function renderFlow() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
        frame: { x: 0, y: 0, width: 320, height: 640 },
      }}
    >
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Verifying"
            component={VerifyingScreen}
            initialParams={{ routine: ROUTINE, videoUri: 'file:///x.mp4' }}
          />
          <Stack.Screen name="Verified" component={StubScreen} />
          <Stack.Screen name="Almost" component={StubScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>,
  );
}

describe('VerifyingScreen navigation', () => {
  beforeEach(() => {
    (verifyRoutine as jest.Mock).mockReset();
  });

  it('routes to Verified when verification passes', async () => {
    (verifyRoutine as jest.Mock).mockResolvedValue({
      verified: true,
      confidence: 0.9,
      reason: 'ok',
      shortReason: 'routine verified',
      model: 'test',
      processingTimeMs: 10,
      policyPassed: true,
      policyIssues: [],
      agents: [],
    });

    const { findByText } = renderFlow();
    // Wait for simulated agent delays (300ms x 2) + navigation
    const node = await findByText(/STUB:Verified/, {}, { timeout: 5000 });
    expect(node).toBeTruthy();
    // The credits should be forwarded on the route params.
    expect(node.props.children.join('')).toContain('+2.50');
  });

  it('routes to Almost with shortReason when verification fails', async () => {
    (verifyRoutine as jest.Mock).mockResolvedValue({
      verified: false,
      confidence: 0.2,
      reason: 'no cup',
      shortReason: 'could not detect cup',
      model: 'test',
      processingTimeMs: 10,
      policyPassed: false,
      policyIssues: [],
      agents: [],
    });

    const { findByText } = renderFlow();
    const node = await findByText(/STUB:Almost/, {}, { timeout: 5000 });
    expect(node.props.children.join('')).toContain('could not detect cup');
  });

  it('routes to Almost when the API rejects (network error)', async () => {
    (verifyRoutine as jest.Mock).mockRejectedValue(new Error('Network down'));

    const { findByText } = renderFlow();
    const node = await findByText(/STUB:Almost/, {}, { timeout: 5000 });
    expect(node.props.children.join('')).toContain('could not reach verification server');
  });
});
