import React, { useRef, useState } from 'react';
import { View, Text, LayoutChangeEvent, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '../theme';

type BarData = {
  label: string;
  value: number;
  date: string;
};

type Props = {
  data: BarData[];
  barColor: string;
  activeBarColor: string;
  formatDetail?: (item: BarData) => string;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
};

export function InteractiveBarChart({
  data,
  barColor,
  activeBarColor,
  formatDetail,
  onScrubStart,
  onScrubEnd,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const chartWidthRef = useRef(0);
  const lastIndexRef = useRef<number | null>(null);
  const isScrubbingRef = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const beginScrub = () => {
    if (isScrubbingRef.current) return;
    isScrubbingRef.current = true;
    onScrubStart?.();
  };

  const endScrub = () => {
    if (!isScrubbingRef.current) return;
    isScrubbingRef.current = false;
    onScrubEnd?.();
  };

  const handleTouch = (x: number) => {
    const w = chartWidthRef.current;
    const len = dataRef.current.length;
    if (w === 0 || len === 0) return;

    const idx = Math.max(0, Math.min(len - 1, Math.floor((x / w) * len)));

    if (idx !== lastIndexRef.current) {
      lastIndexRef.current = idx;
      setSelectedIndex(idx);
      Haptics.selectionAsync();
    }
  };

  const onLayout = (e: LayoutChangeEvent) => {
    chartWidthRef.current = e.nativeEvent.layout.width;
  };

  const selected = selectedIndex !== null ? data[selectedIndex] : null;

  return (
    <View>
      <View
        style={styles.chart}
        onLayout={onLayout}
        onTouchStart={beginScrub}
        onTouchEnd={endScrub}
        onTouchCancel={endScrub}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          lastIndexRef.current = null;
          handleTouch(e.nativeEvent.locationX);
        }}
        onResponderMove={(e) => handleTouch(e.nativeEvent.locationX)}
        onResponderRelease={endScrub}
        onResponderTerminate={endScrub}
      >
        {data.map((item, i) => {
          const pct = item.value / maxValue;
          const isSelected = selectedIndex === i;
          const isLast = i === data.length - 1;
          return (
            <View key={i} style={styles.barCol} pointerEvents="none">
              <View style={styles.barWrap}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(pct * 100, 6)}%`,
                      backgroundColor: isSelected || isLast ? activeBarColor : barColor,
                      opacity: item.value === 0 ? 0.15 : 1,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  typography.labelSm,
                  {
                    color: isSelected || isLast ? colors.onSurface : colors.outlineVariant,
                    fontSize: 10,
                  },
                ]}
              >
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
      {selected && (
        <View style={styles.detail}>
          <Text style={[typography.labelLg, { color: colors.onSurface }]}>
            {selected.date}
          </Text>
          <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>
            {formatDetail
              ? formatDetail(selected)
              : `${selected.value} ${selected.value === 1 ? 'item' : 'items'}`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    gap: 2,
    height: 110,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barWrap: { flex: 1, justifyContent: 'flex-end', width: '100%' },
  bar: { width: '100%', borderRadius: 3, minHeight: 3 },
  detail: {
    marginTop: spacing.stackSm,
    paddingTop: spacing.stackSm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    alignItems: 'center',
    gap: 2,
  },
});
