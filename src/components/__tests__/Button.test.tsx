import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders the label', () => {
    const { getByText } = render(<Button label="Submit" onPress={() => {}} />);
    expect(getByText('Submit')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap me" onPress={onPress} />);
    fireEvent.press(getByText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Disabled" onPress={onPress} disabled />);
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(<Button label="Loading" onPress={onPress} loading />);
    fireEvent.press(getByLabelText('Loading'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('hides the label when loading', () => {
    const { queryByText } = render(<Button label="Saving" onPress={() => {}} loading />);
    // Label is replaced by an ActivityIndicator while loading
    expect(queryByText('Saving')).toBeNull();
  });

  it('exposes accessibilityRole="button"', () => {
    const { getByRole } = render(<Button label="A11y" onPress={() => {}} />);
    expect(getByRole('button')).toBeTruthy();
  });

  it('reflects busy and disabled via accessibilityState', () => {
    const { getByLabelText } = render(<Button label="Load" onPress={() => {}} loading />);
    const btn: any = getByLabelText('Load');
    expect(btn.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  });
});
