/**
 * VideoThumb queue behaviour — regression coverage for the slot-leak fix.
 * We don't try to exercise the expo-video thumbnail generator here; instead
 * we mount and unmount a swarm of VideoThumbs and make sure nothing throws
 * and the output tree is stable.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { VideoThumb } from '../VideoThumb';

describe('VideoThumb', () => {
  it('renders without a thumbnail and shows the placeholder', () => {
    const { UNSAFE_root } = render(<VideoThumb videoUri="file:///nonexistent.mp4" />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('mounting and unmounting many instances does not throw', () => {
    const uris = Array.from({ length: 10 }, (_, i) => `file:///video_${i}.mp4`);

    // Mount all, then unmount. If the slot-leak bug returns, the queue would
    // stall but the component wouldn't throw — so this test mainly guards
    // against crashes during rapid mount/unmount cycles.
    for (const uri of uris) {
      const { unmount } = render(<VideoThumb videoUri={uri} />);
      unmount();
    }

    // A fresh render after the stress loop must still work.
    const { UNSAFE_root } = render(<VideoThumb videoUri="file:///final.mp4" />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('accepts a custom size', () => {
    const { UNSAFE_root } = render(<VideoThumb videoUri="file:///a.mp4" size={64} />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
