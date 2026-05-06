import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AppStateProvider, useAppState } from '../AppState';
import type { CompletionData } from '../../navigation/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

function makeCompletion(overrides: Partial<CompletionData> = {}): CompletionData {
  return {
    task: 'Hydrate',
    timestamp: Date.now(),
    icon: 'water-drop',
    credits: '+2.50',
    sponsor: 'Liquid Death',
    routineId: 'hydrate',
    ...overrides,
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}

describe('AppState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides default state', async () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    // Wait for async load
    await act(async () => {});

    expect(result.current.completions).toEqual([]);
    expect(result.current.totalCredits).toBe(0);
    expect(result.current.todayCredits).toBe(0);
    expect(result.current.streak).toBe(0);
    expect(result.current.hasOnboarded).toBe(false);
    expect(result.current.favoriteRoutineIds).toEqual([]);
    expect(result.current.showVideoThumbnails).toBe(true);
    expect(result.current.dailyGoal).toBe(3);
    expect(result.current.dailyProgress).toBe(0);
    expect(result.current.todayRoutineIds.size).toBe(0);
  });

  it('adds a completion', async () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    await act(async () => {});

    const completion = makeCompletion();

    act(() => {
      result.current.addCompletion(completion);
    });

    expect(result.current.completions).toHaveLength(1);
    expect(result.current.completions[0].task).toBe('Hydrate');
    expect(result.current.totalCredits).toBe(2.5);
    expect(result.current.todayCredits).toBe(2.5);
  });

  it('prepends new completions (newest first)', async () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    await act(async () => {});

    act(() => {
      result.current.addCompletion(makeCompletion({ task: 'First', credits: '+1.00' }));
    });
    act(() => {
      result.current.addCompletion(makeCompletion({ task: 'Second', credits: '+2.00' }));
    });

    expect(result.current.completions[0].task).toBe('Second');
    expect(result.current.completions[1].task).toBe('First');
    expect(result.current.totalCredits).toBe(3);
  });

  it('toggles favorite routines', async () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    await act(async () => {});

    // Add favorite
    act(() => {
      result.current.toggleFavoriteRoutine('hydrate');
    });
    expect(result.current.favoriteRoutineIds).toContain('hydrate');

    // Add another
    act(() => {
      result.current.toggleFavoriteRoutine('brush-teeth');
    });
    expect(result.current.favoriteRoutineIds).toContain('hydrate');
    expect(result.current.favoriteRoutineIds).toContain('brush-teeth');

    // Remove first
    act(() => {
      result.current.toggleFavoriteRoutine('hydrate');
    });
    expect(result.current.favoriteRoutineIds).not.toContain('hydrate');
    expect(result.current.favoriteRoutineIds).toContain('brush-teeth');
  });

  it('sets onboarded flag', async () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    await act(async () => {});

    expect(result.current.hasOnboarded).toBe(false);

    act(() => {
      result.current.setOnboarded();
    });

    expect(result.current.hasOnboarded).toBe(true);
  });

  it('toggles video thumbnails', async () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    await act(async () => {});

    expect(result.current.showVideoThumbnails).toBe(true);

    act(() => {
      result.current.setShowVideoThumbnails(false);
    });

    expect(result.current.showVideoThumbnails).toBe(false);
  });

  it('computes today completions correctly', async () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    await act(async () => {});

    // Add today's completion
    act(() => {
      result.current.addCompletion(makeCompletion({ credits: '+3.00' }));
    });

    // Add yesterday's completion
    act(() => {
      result.current.addCompletion(
        makeCompletion({
          credits: '+5.00',
          timestamp: Date.now() - 86400000,
        })
      );
    });

    expect(result.current.todayCompletions).toHaveLength(1);
    expect(result.current.todayCredits).toBe(3);
    expect(result.current.totalCredits).toBe(8);
  });

  it('handles self-verified completions (zero credits)', async () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    await act(async () => {});

    act(() => {
      result.current.addCompletion(
        makeCompletion({ credits: '+0.00', selfVerified: true })
      );
    });

    expect(result.current.completions).toHaveLength(1);
    expect(result.current.totalCredits).toBe(0);
  });

  it('throws when used outside provider', () => {
    // Suppress console.error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAppState());
    }).toThrow('useAppState must be used within AppStateProvider');

    spy.mockRestore();
  });

  describe('daily goal', () => {
    it('has default daily goal of 3', async () => {
      const { result } = renderHook(() => useAppState(), { wrapper });
      await act(async () => {});

      expect(result.current.dailyGoal).toBe(3);
    });

    it('sets daily goal', async () => {
      const { result } = renderHook(() => useAppState(), { wrapper });
      await act(async () => {});

      act(() => {
        result.current.setDailyGoal(5);
      });

      expect(result.current.dailyGoal).toBe(5);
    });

    it('clamps daily goal to minimum of 1', async () => {
      const { result } = renderHook(() => useAppState(), { wrapper });
      await act(async () => {});

      act(() => {
        result.current.setDailyGoal(0);
      });

      expect(result.current.dailyGoal).toBe(1);
    });

    it('clamps daily goal to maximum of 14', async () => {
      const { result } = renderHook(() => useAppState(), { wrapper });
      await act(async () => {});

      act(() => {
        result.current.setDailyGoal(20);
      });

      expect(result.current.dailyGoal).toBe(14);
    });

    it('computes daily progress correctly', async () => {
      const { result } = renderHook(() => useAppState(), { wrapper });
      await act(async () => {});

      // Set goal to 2
      act(() => {
        result.current.setDailyGoal(2);
      });

      // Add 1 completion
      act(() => {
        result.current.addCompletion(makeCompletion());
      });

      expect(result.current.dailyProgress).toBe(0.5);

      // Add another
      act(() => {
        result.current.addCompletion(makeCompletion({ routineId: 'brush-teeth' }));
      });

      expect(result.current.dailyProgress).toBe(1);
    });

    it('caps daily progress at 1', async () => {
      const { result } = renderHook(() => useAppState(), { wrapper });
      await act(async () => {});

      act(() => {
        result.current.setDailyGoal(1);
      });

      act(() => {
        result.current.addCompletion(makeCompletion());
      });
      act(() => {
        result.current.addCompletion(makeCompletion({ routineId: 'brush-teeth' }));
      });

      expect(result.current.dailyProgress).toBe(1);
    });
  });

  describe('routine cooldown', () => {
    it('tracks today routine IDs', async () => {
      const { result } = renderHook(() => useAppState(), { wrapper });
      await act(async () => {});

      act(() => {
        result.current.addCompletion(makeCompletion({ routineId: 'hydrate' }));
      });

      expect(result.current.todayRoutineIds.has('hydrate')).toBe(true);
      expect(result.current.todayRoutineIds.has('brush-teeth')).toBe(false);
    });

    it('isRoutineCompletedToday returns true for completed routine', async () => {
      const { result } = renderHook(() => useAppState(), { wrapper });
      await act(async () => {});

      act(() => {
        result.current.addCompletion(makeCompletion({ routineId: 'hydrate' }));
      });

      expect(result.current.isRoutineCompletedToday('hydrate')).toBe(true);
      expect(result.current.isRoutineCompletedToday('brush-teeth')).toBe(false);
    });

    it('does not count yesterday completions as today', async () => {
      const { result } = renderHook(() => useAppState(), { wrapper });
      await act(async () => {});

      act(() => {
        result.current.addCompletion(
          makeCompletion({
            routineId: 'hydrate',
            timestamp: Date.now() - 86400000,
          })
        );
      });

      expect(result.current.isRoutineCompletedToday('hydrate')).toBe(false);
    });
  });
});
