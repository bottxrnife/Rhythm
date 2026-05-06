import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isToday, getDayKey } from '../utils/time';
import type { CompletionData } from '../navigation/types';

// ── Types ──

type AppState = {
  completions: CompletionData[];
  hasOnboarded: boolean;
  favoriteRoutineIds: string[];
  showVideoThumbnails: boolean;
  dailyGoal: number;
};

type AppContextValue = {
  completions: CompletionData[];
  totalCredits: number;
  todayCompletions: CompletionData[];
  todayCredits: number;
  streak: number;
  hasOnboarded: boolean;
  favoriteRoutineIds: string[];
  showVideoThumbnails: boolean;
  dailyGoal: number;
  dailyProgress: number;
  isLoading: boolean;
  addCompletion: (completion: CompletionData) => void;
  setOnboarded: () => void;
  toggleFavoriteRoutine: (routineId: string) => void;
  setShowVideoThumbnails: (show: boolean) => void;
  setDailyGoal: (goal: number) => void;
  clearAllData: () => void;
  isRoutineCompletedToday: (routineId: string) => boolean;
  todayRoutineIds: Set<string>;
};

// ── Defaults ──

const STORAGE_KEY = 'rhythm_app_state';

const defaultState: AppState = {
  completions: [],
  hasOnboarded: false,
  favoriteRoutineIds: [],
  showVideoThumbnails: true,
  dailyGoal: 3,
};

// ── Context ──

const AppContext = createContext<AppContextValue | null>(null);

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

// ── Helpers ──

function parseCredits(str: string): number {
  return parseFloat(str.replace('+', '')) || 0;
}

function computeStreak(completions: CompletionData[]): number {
  if (completions.length === 0) return 0;

  // Get unique days with completions, sorted newest first
  const days = new Set<string>();
  for (const c of completions) {
    days.add(getDayKey(c.timestamp));
  }

  const sortedDays = Array.from(days).sort().reverse();
  const today = getDayKey(Date.now());
  const yesterday = getDayKey(Date.now() - 86400000);

  // Streak must include today or yesterday
  if (sortedDays[0] !== today && sortedDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prevDate = new Date(sortedDays[i - 1].split('-').map(Number).join('/'));
    const currDate = new Date(sortedDays[i].split('-').map(Number).join('/'));
    const diffMs = prevDate.getTime() - currDate.getTime();
    if (diffMs <= 86400000 * 1.5) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ── Provider ──

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setState({ ...defaultState, ...JSON.parse(raw) } as AppState);
        }
      } catch {
        // First launch or corrupt data
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }
  }, [state, isLoading]);

  const addCompletion = useCallback((completion: CompletionData) => {
    setState((prev) => ({
      ...prev,
      completions: [completion, ...prev.completions],
    }));
  }, []);

  const setOnboarded = useCallback(() => {
    setState((prev) => ({ ...prev, hasOnboarded: true }));
  }, []);

  const toggleFavoriteRoutine = useCallback((routineId: string) => {
    setState((prev) => {
      const isFavorite = prev.favoriteRoutineIds.includes(routineId);
      return {
        ...prev,
        favoriteRoutineIds: isFavorite
          ? prev.favoriteRoutineIds.filter((id) => id !== routineId)
          : [routineId, ...prev.favoriteRoutineIds],
      };
    });
  }, []);

  const setShowVideoThumbnails = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showVideoThumbnails: show }));
  }, []);

  const setDailyGoal = useCallback((goal: number) => {
    setState((prev) => ({ ...prev, dailyGoal: Math.max(1, Math.min(14, goal)) }));
  }, []);

  const clearAllData = useCallback(() => {
    setState(defaultState);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  // Derived values
  const todayCompletions = state.completions.filter((c) => isToday(c.timestamp));
  const todayCredits = todayCompletions.reduce((sum, c) => sum + parseCredits(c.credits), 0);
  const totalCredits = state.completions.reduce((sum, c) => sum + parseCredits(c.credits), 0);
  const streak = computeStreak(state.completions);
  const todayRoutineIds = new Set(todayCompletions.map((c) => c.routineId));
  const dailyProgress = Math.min(todayCompletions.length / state.dailyGoal, 1);

  const isRoutineCompletedToday = useCallback(
    (routineId: string) => todayRoutineIds.has(routineId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayCompletions.length],
  );

  return (
    <AppContext.Provider
      value={{
        completions: state.completions,
        totalCredits,
        todayCompletions,
        todayCredits,
        streak,
        hasOnboarded: state.hasOnboarded,
        favoriteRoutineIds: state.favoriteRoutineIds,
        showVideoThumbnails: state.showVideoThumbnails,
        dailyGoal: state.dailyGoal,
        dailyProgress,
        isLoading,
        addCompletion,
        setOnboarded,
        toggleFavoriteRoutine,
        setShowVideoThumbnails,
        setDailyGoal,
        clearAllData,
        isRoutineCompletedToday,
        todayRoutineIds,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
