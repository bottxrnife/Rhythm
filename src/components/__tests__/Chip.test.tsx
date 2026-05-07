import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Chip } from '../Chip';

describe('Chip', () => {
  it('renders the label', () => {
    const { getByText } = render(<Chip label="Hygiene" />);
    expect(getByText('Hygiene')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Chip label="Pets" onPress={onPress} />);
    fireEvent.press(getByText('Pets'));
    expect(onPress).toHaveBeenCalled();
  });

  it('reports selected state via accessibilityState when active', () => {
    const { getByLabelText } = render(<Chip label="Favorites" active onPress={() => {}} />);
    const node: any = getByLabelText('Favorites');
    expect(node.props.accessibilityState).toMatchObject({ selected: true });
  });
});
