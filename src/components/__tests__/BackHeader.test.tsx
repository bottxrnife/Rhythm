import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BackHeader } from '../BackHeader';
import { Text, View } from 'react-native';

const Stack = createNativeStackNavigator();

function Page({ title }: { title: string }) {
  return (
    <View>
      <BackHeader title={title} />
      <Text>Content</Text>
    </View>
  );
}

describe('BackHeader', () => {
  it('renders the provided title', () => {
    const { getByText } = render(
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 0, bottom: 0, left: 0, right: 0 },
          frame: { x: 0, y: 0, width: 320, height: 640 },
        }}
      >
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="First">{() => <Page title="Details" />}</Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>,
    );
    expect(getByText('Details')).toBeTruthy();
  });

  it('exposes a back button with the right accessibility label', () => {
    const { getByLabelText } = render(
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 0, bottom: 0, left: 0, right: 0 },
          frame: { x: 0, y: 0, width: 320, height: 640 },
        }}
      >
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="First">{() => <Page title="Details" />}</Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>,
    );
    expect(getByLabelText('Go back')).toBeTruthy();
  });

  it('the back button is pressable without throwing even on the root screen', () => {
    const { getByLabelText } = render(
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 0, bottom: 0, left: 0, right: 0 },
          frame: { x: 0, y: 0, width: 320, height: 640 },
        }}
      >
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="First">{() => <Page title="Details" />}</Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>,
    );
    expect(() => fireEvent.press(getByLabelText('Go back'))).not.toThrow();
  });
});
