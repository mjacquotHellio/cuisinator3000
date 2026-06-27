import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllSportSessions } from '../database';
import { colors, typography, spacing, radii, shadows } from '../theme';
import type { SportSession } from '../types';

const SPORT_GREEN = '#22C55E';

function formatTime(totalSeconds: number): string {
  if (totalSeconds === 0) return '—';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m < 60) return `${m}:${s.toString().padStart(2, '0')}`;
  const h = Math.floor(m / 60);
  const remainM = m % 60;
  return `${h}h${remainM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function StatCard({
  icon,
  label,
  value,
  color,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <View style={[s.card, { borderLeftColor: color }]}>
      <View style={[s.cardIconBox, { backgroundColor: color + '18' }]}>
        <Text style={s.cardIcon}>{icon}</Text>
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardLabel}>{label}</Text>
        <Text style={[s.cardValue, { color }]}>{value}</Text>
        {sub ? <Text style={s.cardSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

interface SportStatsPanelProps {
  width: number;
  isFocused: boolean;
  focusKey: number;
  onGoMain: () => void;
}

export function SportStatsPanel({ width, isFocused, focusKey, onGoMain }: SportStatsPanelProps) {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<SportSession[]>([]);

  const loadData = useCallback(() => {
    setSessions(getAllSportSessions());
  }, []);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, focusKey]);

  const totalPushUps = sessions.reduce((acc, s) => acc + s.push_ups + s.knee_push_ups, 0);
  const totalNormalPushUps = sessions.reduce((acc, s) => acc + s.push_ups, 0);
  const totalKneePushUps = sessions.reduce((acc, s) => acc + s.knee_push_ups, 0);
  const totalAbs = sessions.reduce((acc, s) => acc + s.abs, 0);
  const totalTime = sessions.reduce((acc, s) => acc + s.total_time, 0);
  const totalSessions = sessions.length;

  return (
    <View style={[s.root, { width }]} pointerEvents={isFocused ? 'auto' : 'none'}>
      <View style={[s.header, { paddingTop: insets.top + spacing.xl }]}>
        <TouchableOpacity onPress={onGoMain} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Bilan total</Text>
          <Text style={s.headerSub}>Depuis le début de l'aventure</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {totalSessions === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📊</Text>
            <Text style={s.emptyTitle}>Aucune donnée</Text>
            <Text style={s.emptySub}>Renseigne tes premières perfs pour voir le bilan</Text>
          </View>
        ) : (
          <>
            <StatCard
              icon="📅"
              label="Sessions enregistrées"
              value={String(totalSessions)}
              color="#F59E0B"
              sub={`${totalSessions} jour${totalSessions > 1 ? 's' : ''} de sport`}
            />
            <StatCard
              icon="⏱"
              label="Temps de sport total"
              value={formatTime(totalTime)}
              color="#3B82F6"
            />
            <StatCard
              icon="💪"
              label="Pompes totales"
              value={String(totalPushUps)}
              color={SPORT_GREEN}
              sub={`${totalNormalPushUps} normales · ${totalKneePushUps} sur genoux`}
            />
            <StatCard
              icon="🔥"
              label="Abdominaux totaux"
              value={String(totalAbs)}
              color="#EF4444"
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.dark,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backBtnText: {
    fontSize: 20,
    color: colors.surface,
    fontWeight: typography.fontWeights.bold,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.surface,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderLeftWidth: 4,
    ...shadows.md,
  },
  cardIconBox: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
  },
  cardLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.extraBold,
    letterSpacing: -1,
  },
  cardSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxxl,
    gap: spacing.lg,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: typography.fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
  },
});
