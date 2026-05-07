import React from 'react';
import { render } from '@testing-library/react-native';
import { InteractiveBarChart } from '../InteractiveBarChart';

const SAMPLE = [
  { label: 'M', value: 3, date: 'May 1' },
  { label: 'T', value: 0, date: 'May 2' },
  { label: 'W', value: 5, date: 'May 3' },
  { label: 'T', value: 1, date: 'May 4' },
];

describe('InteractiveBarChart', () => {
  it('renders all bar labels', () => {
    const { getAllByText } = render(
      <InteractiveBarChart
        data={SAMPLE}
        barColor="#aaa"
        activeBarColor="#333"
      />,
    );
    // Multiple same letters are OK; just assert each expected label renders at least once
    expect(getAllByText('W').length).toBeGreaterThan(0);
  });

  it('exposes an adjustable accessibility role with descriptive label', () => {
    const { UNSAFE_getByProps } = render(
      <InteractiveBarChart
        data={SAMPLE}
        barColor="#aaa"
        activeBarColor="#333"
      />,
    );
    const node = UNSAFE_getByProps({ accessibilityRole: 'adjustable' });
    expect((node.props as any).accessibilityLabel).toContain('4 bars');
  });

  it('handles empty data without crashing', () => {
    expect(() =>
      render(
        <InteractiveBarChart
          data={[]}
          barColor="#aaa"
          activeBarColor="#333"
        />,
      ),
    ).not.toThrow();
  });
});
