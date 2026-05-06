import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TopBar } from '../components';
import { useAppState } from '../state/AppState';
import { formatCompletionTime } from '../utils/time';
import { colors, typography, spacing, shadows } from '../theme';
import { ROUTINES, getSuggestedRoutine } from '../data/routines';
import type { RootStackParamList } from '../navigation/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 17) return 'Good afternoon.';
  return 'Good evening.';
}

function getSubtitle(todayCount: number): string {
  if (todayCount === 0) return 'One small step to start your day.';
  if (todayCount === 1) return 'Nice start. Keep the rhythm going.';
  if (todayCount < 4) return "You're building momentum.";
  return 'Great day. You showed up for yourself.';
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { todayCompletions, todayCredits, favoriteRoutineIds, todayRoutineIds, dailyGoal, dailyProgress, streak } = useAppState();

  // Suggest a routine the user hasn't done today
  const doneToday = todayRoutineIds;
  const notDoneToday = ROUTINES.filter((r) => !doneToday.has(r.id));
  const favoriteRoutines = favoriteRoutineIds
    .map((id) => ROUTINES.find((routine) => routine.id === id))
    .filter((routine): routine is (typeof ROUTINES)[number] => Boolean(routine));
  const favoriteNotDoneToday = favoriteRoutines.find((routine) => !doneToday.has(routine.id));
  const suggested = favoriteNotDoneToday ?? (notDoneToday.length > 0 ? notDoneToday[0] : getSuggestedRoutine());

  const greeting = getGreeting();
  const subtitle = getSubtitle(todayCompletions.length);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar
        onAvatarPress={() => navigation.navigate('Profile')}
        onSettingsPress={() => navigation.navigate('Settings')}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={[typography.headlineLg, { color: colors.onSurface }]}>
            {greeting}
          </Text>
          <Text style={[typography.bodyLg, { color: colors.onSurfaceVariant }]}>
            {subtitle}
          </Text>
        </View>

        {/* Today's progress — compact row */}
        <View style={[styles.statsRow, shadows.diffuse]}>
          <Pressable
            style={styles.statBox}
            onPress={() => navigation.navigate('Main', { screen: 'History' })}
          >
            <Text style={[typography.headlineLg, { color: colors.primary }]}>
              {todayCompletions.length}
            </Text>
            <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>
              Today
            </Text>
          </Pressable>
          <View style={styles.statDivider} />
          <Pressable
            style={styles.statBox}
            onPress={() => navigation.navigate('Main', { screen: 'History' })}
          >
            <Text style={[typography.headlineLg, { color: colors.primary }]}>
              {streak}
            </Text>
            <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>
              Streak
            </Text>
          </Pressable>
          <View style={styles.statDivider} />
          <Pressable
            style={styles.statBox}
            onPress={() => navigation.navigate('Main', { screen: 'Rewards' })}
          >
            <Text style={[typography.headlineLg, { color: colors.tertiary }]}>
              +{todayCredits.toFixed(2)}
            </Text>
            <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>
              Earned
            </Text>
          </Pressable>
        </View>

        {/* Daily Goal Progress */}
        <View style={styles.goalSection}>
          <View style={styles.goalHeader}>
            <Text style={[typography.labelLg, { color: colors.onSurface }]}>
              Daily Goal
            </Text>
            <Text style={[typography.labelSm, { color: dailyProgress >= 1 ? colors.primary : colors.onSurfaceVariant }]}>
              {todayCompletions.length}/{dailyGoal}
            </Text>
          </View>
          <View style={styles.goalBar}>
            <View
              style={[
                styles.goalFill,
                {
                  width: `${Math.min(dailyProgress * 100, 100)}%`,
                  backgroundColor: dailyProgress >= 1 ? colors.primary : colors.primaryFixedDim,
                },
              ]}
            />
          </View>
          {dailyProgress >= 1 && (
            <View style={styles.goalComplete}>
              <MaterialIcons name="check-circle" size={14} color={colors.primary} />
              <Text style={[typography.labelSm, { color: colors.primary }]}>
                Goal reached! Great rhythm today.
              </Text>
            </View>
          )}
        </View>

        {/* Suggested routine — clean card, no nested button */}
        <View style={styles.section}>
          <Text style={[typography.labelLg, { color: colors.onSurface }]}>
            Next Up
          </Text>
          <Pressable
            onPress={() => navigation.navigate('RoutineDetail', { routine: suggested })}
            style={({ pressed }) => [styles.suggestedCard, shadows.diffuse, pressed && styles.cardPressed]}
          >
            <View style={styles.suggestedIcon}>
              <MaterialIcons name={suggested.icon as any} size={24} color={colors.primary} />
            </View>
            <View style={styles.suggestedInfo}>
              <Text style={[typography.headlineMd, { color: colors.onSurface }]}>
                {suggested.title}
              </Text>
              <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                {suggested.description}
              </Text>
            </View>
            <View style={styles.suggestedTrailing}>
              <View style={styles.creditPill}>
                <MaterialIcons name="stars" size={12} color={colors.tertiary} />
                <Text style={[typography.labelSm, { color: colors.tertiary }]}>
                  {suggested.credits}
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color={colors.primary} />
            </View>
          </Pressable>
        </View>

        {/* Favorite routines */}
        {favoriteRoutines.length > 0 && (
          <View style={styles.section}>
            <Text style={[typography.labelLg, { color: colors.onSurface }]}>
              Favorites
            </Text>
            <View style={[styles.completionList, shadows.diffuse]}>
              {favoriteRoutines.slice(0, 3).map((routine, i) => (
                <View key={routine.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <Pressable
                    onPress={() => navigation.navigate('RoutineDetail', { routine })}
                    style={({ pressed }) => [styles.favoriteRow, pressed && styles.cardPressed]}
                  >
                    <View style={styles.favoriteIcon}>
                      <MaterialIcons name={routine.icon as any} size={18} color={colors.primary} />
                    </View>
                    <View style={styles.favoriteInfo}>
                      <Text style={[typography.labelLg, { color: colors.onSurface }]}>
                        {routine.title}
                      </Text>
                      <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>
                        {doneToday.has(routine.id) ? 'Completed today' : 'Ready when you are'}
                      </Text>
                    </View>
                    <MaterialIcons name="star" size={18} color={colors.tertiary} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent completions — only show if there are any */}
        {todayCompletions.length > 0 && (
          <View style={styles.section}>
            <Text style={[typography.labelLg, { color: colors.onSurface }]}>
              Completed Today
            </Text>
            <View style={[styles.completionList, shadows.diffuse]}>
              {todayCompletions.slice(0, 3).map((item, i) => (
                <View key={i}>
                  {i > 0 && <View style={styles.divider} />}
                  <Pressable
                    onPress={() => navigation.navigate('CompletionDetail', { completion: item })}
                    style={({ pressed }) => [styles.completionRow, pressed && styles.cardPressed]}
                  >
                    <View style={styles.completionIcon}>
                      <MaterialIcons name={item.icon as any} size={18} color={colors.primary} />
                    </View>
                    <Text style={[typography.labelLg, { color: colors.onSurface, flex: 1 }]}>
                      {item.task}
                    </Text>
                    <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>
                      {formatCompletionTime(item.timestamp).split(', ')[1]}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.marginPage,
    paddingBottom: 120,
    gap: spacing.stackLg,
  },
  greeting: { gap: spacing.stackSm, paddingTop: 16 },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.outlineVariant },

  // Sections
  section: { gap: spacing.stackSm },

  // Daily Goal
  goalSection: { gap: 6 },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalBar: {
    height: 8,
    borderRadius: 9999,
    backgroundColor: colors.surfaceVariant,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 9999,
  },
  goalComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },

  // Suggested card
  suggestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  cardPressed: { backgroundColor: colors.surfaceContainerLow },
  suggestedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedInfo: { flex: 1, gap: 4 },
  suggestedTrailing: { alignItems: 'flex-end', gap: 8 },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,222,169,0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
  },

  // Completion list
  completionList: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.outlineVariant },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  completionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  favoriteIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteInfo: { flex: 1, gap: 2 },
});
