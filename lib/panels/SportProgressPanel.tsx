import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllSportSessions } from '../database';
import { colors, typography, spacing, radii } from '../theme';
import type { SportSession } from '../types';

const SPORT_GREEN = '#22C55E';
const SPORT_AMBER = '#F59E0B';
const SPORT_RED   = '#EF4444';

// ─── Constantes graphique ─────────────────────────────────────

const CHART_H    = 180;
const PAD_TOP    = 12;
const PAD_BOTTOM = 8;
const PAD_LEFT   = 44; // espace pour l'axe Y
const PAD_RIGHT  = 10;

// ─── Helpers ─────────────────────────────────────────────────

type Period = '7j' | '30j' | '1an';

const PERIODS: { label: string; key: Period; days: number }[] = [
  { label: '7 jours',  key: '7j',  days: 7 },
  { label: '30 jours', key: '30j', days: 30 },
  { label: '1 an',     key: '1an', days: 365 },
];

function getDateStr(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

function formatTime(totalSeconds: number): string {
  if (totalSeconds === 0) return '0:00';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m < 60) return `${m}:${s.toString().padStart(2, '0')}`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h}h${rem.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const DAYS_FR_SHORT   = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR_SHORT = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin',
                          'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

function xLabel(dateStr: string, period: Period): string {
  const d = new Date(dateStr + 'T12:00:00');
  if (period === '7j')  return `${DAYS_FR_SHORT[d.getDay()]} ${d.getDate()}`;
  if (period === '30j') return `${d.getDate()} ${MONTHS_FR_SHORT[d.getMonth()]}`;
  return MONTHS_FR_SHORT[d.getMonth()];
}

// ─── Séries ───────────────────────────────────────────────────

interface SeriesDef {
  key: 'pushUps' | 'kneePushUps' | 'abs';
  label: string;
  icon: string;
  color: string;
  getValue: (s: SportSession) => number;
}

const ALL_SERIES: SeriesDef[] = [
  { key: 'pushUps',     label: 'Pompes normales', icon: '💪', color: SPORT_GREEN, getValue: (s) => s.push_ups },
  { key: 'kneePushUps', label: 'Pompes genoux', icon: '🦵', color: SPORT_AMBER, getValue: (s) => s.knee_push_ups },
  { key: 'abs',         label: 'Abdos',          icon: '🔥', color: SPORT_RED,   getValue: (s) => s.abs },
];

// ─── Dessin d'un segment ──────────────────────────────────────

function LineSegment({ x1, y1, x2, y2, color }: {
  x1: number; y1: number; x2: number; y2: number; color: string;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 0.5) return null;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return (
    <View
      style={{
        position: 'absolute',
        width: length,
        height: 2.5,
        borderRadius: 2,
        backgroundColor: color,
        left: cx - length / 2,
        top: cy - 1.25,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

// ─── Graphique ────────────────────────────────────────────────

function Chart({
  sessions,
  activeSeries,
  chartWidth,
  period,
}: {
  sessions: SportSession[];
  activeSeries: Set<SeriesDef['key']>;
  chartWidth: number;
  period: Period;
}) {
  if (sessions.length === 0 || chartWidth === 0) return null;

  const innerW = chartWidth - PAD_LEFT - PAD_RIGHT;
  const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;

  // Échelle Y partagée entre toutes les séries actives
  const allValues = ALL_SERIES.filter((s) => activeSeries.has(s.key))
    .flatMap((serie) => sessions.map(serie.getValue));
  const yMin = 0;
  const yMax = Math.max(...allValues, 1);
  const yRange = yMax - yMin;

  function toX(i: number): number {
    return PAD_LEFT + (sessions.length === 1 ? innerW / 2 : (i / (sessions.length - 1)) * innerW);
  }
  function toY(v: number): number {
    return PAD_TOP + (1 - (v - yMin) / yRange) * innerH;
  }

  // Graduations Y : 4 lignes (0%, 33%, 66%, 100%)
  const yTicks = [0, 0.33, 0.66, 1].map((frac) => ({
    y: PAD_TOP + (1 - frac) * innerH,
    label: Math.round(yMin + frac * yRange),
  }));

  // Sélection des étiquettes X (max 6 labels)
  const maxLabels = period === '7j' ? 7 : period === '30j' ? 6 : 6;
  const labelStep = Math.max(1, Math.ceil(sessions.length / maxLabels));
  const xTickIndices = sessions
    .map((_, i) => i)
    .filter((i) => i % labelStep === 0 || i === sessions.length - 1);

  return (
    <View>
      {/* Zone graphique */}
      <View style={{ width: chartWidth, height: CHART_H }}>
        {/* Grilles horizontales + labels Y */}
        {yTicks.map(({ y, label }) => (
          <View key={label} style={{ position: 'absolute', left: 0, top: y - 1, width: chartWidth }}>
            {/* Label Y */}
            <Text style={{
              position: 'absolute',
              left: 0,
              top: -8,
              width: PAD_LEFT - 6,
              textAlign: 'right',
              fontSize: 9,
              color: colors.textSecondary,
              fontWeight: typography.fontWeights.medium,
            }}>
              {label}
            </Text>
            {/* Ligne de grille */}
            <View style={{
              position: 'absolute',
              left: PAD_LEFT,
              top: 0,
              right: PAD_RIGHT,
              height: 1,
              backgroundColor: colors.border,
            }} />
          </View>
        ))}

        {/* Courbes */}
        {ALL_SERIES.filter((s) => activeSeries.has(s.key)).map((serie) => {
          const pts = sessions.map((s, i) => ({
            x: toX(i),
            y: toY(serie.getValue(s)),
          }));
          return pts.map((pt, i) => (
            <View key={`${serie.key}-${i}`}>
              {i < pts.length - 1 && (
                <LineSegment
                  x1={pt.x} y1={pt.y}
                  x2={pts[i + 1].x} y2={pts[i + 1].y}
                  color={serie.color}
                />
              )}
              <View style={{
                position: 'absolute',
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: serie.color,
                borderWidth: 1.5,
                borderColor: colors.surface,
                left: pt.x - 3.5,
                top: pt.y - 3.5,
              }} />
            </View>
          ));
        })}
      </View>

      {/* Axe X — labels dates */}
      <View style={{ width: chartWidth, height: 24, position: 'relative', marginTop: 2 }}>
        {xTickIndices.map((i) => {
          const x = toX(i);
          const label = xLabel(sessions[i].date, period);
          return (
            <Text
              key={sessions[i].date}
              style={{
                position: 'absolute',
                left: x - 28,
                top: 2,
                width: 56,
                fontSize: 9,
                color: colors.textSecondary,
                textAlign: 'center',
                fontWeight: typography.fontWeights.medium,
              }}
            >
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

// ─── Cases à cocher ───────────────────────────────────────────

function SeriesToggle({
  serie, active, onToggle,
}: {
  serie: SeriesDef; active: boolean; onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[chk.item, active && { borderColor: serie.color, backgroundColor: serie.color + '15' }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[chk.box, {
        borderColor: active ? serie.color : colors.border,
        backgroundColor: active ? serie.color : 'transparent',
      }]}>
        {active && <Text style={chk.check}>✓</Text>}
      </View>
      <Text style={chk.icon}>{serie.icon}</Text>
      <Text style={[chk.label, active && { color: serie.color, fontWeight: typography.fontWeights.semiBold }]}>
        {serie.label}
      </Text>
    </TouchableOpacity>
  );
}

const chk = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  box: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { fontSize: 10, color: colors.surface, fontWeight: typography.fontWeights.bold },
  icon:  { fontSize: 13 },
  label: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
});

// ─── Résumé période ───────────────────────────────────────────

function PeriodSummary({ sessions }: { sessions: SportSession[] }) {
  if (sessions.length === 0) return null;
  const totalNormal = sessions.reduce((a, s) => a + s.push_ups, 0);
  const totalKnee   = sessions.reduce((a, s) => a + s.knee_push_ups, 0);
  const totalAbs    = sessions.reduce((a, s) => a + s.abs, 0);
  const totalTime   = sessions.reduce((a, s) => a + s.total_time, 0);
  return (
    <View style={sum.card}>
      <Text style={sum.title}>{sessions.length} séance{sessions.length > 1 ? 's' : ''}</Text>
      <View style={sum.row}>
        <SumItem value={String(totalNormal)} label="pompes"        color={SPORT_GREEN} />
        <View style={sum.sep} />
        <SumItem value={String(totalKnee)}   label="p. genoux"     color={SPORT_AMBER} />
        <View style={sum.sep} />
        <SumItem value={String(totalAbs)}    label="abdos"         color={SPORT_RED} />
        <View style={sum.sep} />
        <SumItem value={formatTime(totalTime)} label="temps"       color={colors.textSecondary} />
      </View>
    </View>
  );
}

function SumItem({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={sum.item}>
      <Text style={[sum.val, { color }]}>{value}</Text>
      <Text style={sum.lbl}>{label}</Text>
    </View>
  );
}

const sum = StyleSheet.create({
  card: {
    backgroundColor: colors.dark,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  item: { alignItems: 'center', gap: 2 },
  val:  { fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.extraBold },
  lbl:  { fontSize: typography.fontSizes.xs, color: colors.textSecondary, fontWeight: typography.fontWeights.medium },
  sep:  { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },
});

// ─── Panel progression ────────────────────────────────────────

interface SportProgressPanelProps {
  width: number;
  isFocused: boolean;
  focusKey: number;
  onGoMain: () => void;
}

export function SportProgressPanel({ width, isFocused, focusKey, onGoMain }: SportProgressPanelProps) {
  const insets = useSafeAreaInsets();
  const [period, setPeriod]   = useState<Period>('7j');
  const [sessions, setSessions] = useState<SportSession[]>([]);
  const [chartWidth, setChartWidth] = useState(0);
  const [active, setActive]   = useState<Set<SeriesDef['key']>>(
    new Set(['pushUps', 'kneePushUps', 'abs'])
  );

  const loadData = useCallback(() => { setSessions(getAllSportSessions()); }, []);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, focusKey]);

  function toggle(key: SeriesDef['key']) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  }

  const cutoff   = getDateStr(-PERIODS.find((p) => p.key === period)!.days);
  const filtered = sessions.filter((s) => s.date >= cutoff).reverse(); // chrono

  return (
    <View style={[s.root, { width }]} pointerEvents={isFocused ? 'auto' : 'none'}>
      <View style={[s.header, { paddingTop: insets.top + spacing.xl }]}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={onGoMain} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Progression</Text>
        </View>
        <View style={s.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[s.periodBtn, period === p.key && s.periodBtnActive]}
              onPress={() => setPeriod(p.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.periodBtnText, period === p.key && s.periodBtnTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📈</Text>
            <Text style={s.emptyTitle}>Aucune session</Text>
            <Text style={s.emptySub}>sur cette période</Text>
          </View>
        ) : (
          <>
            <PeriodSummary sessions={filtered} />

            {/* Graphique */}
            <View
              style={s.chartCard}
              onLayout={(e) => setChartWidth(e.nativeEvent.layout.width - spacing.xl * 2)}
            >
              {chartWidth > 0 && (
                <Chart
                  sessions={filtered}
                  activeSeries={active}
                  chartWidth={chartWidth}
                  period={period}
                />
              )}
            </View>

            {/* Cases à cocher */}
            <View style={s.checkboxGrid}>
              {ALL_SERIES.map((serie) => (
                <SeriesToggle
                  key={serie.key}
                  serie={serie}
                  active={active.has(serie.key)}
                  onToggle={() => toggle(serie.key)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.dark,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backBtnText: { fontSize: 20, color: colors.surface, fontWeight: typography.fontWeights.bold },
  headerTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.surface,
    letterSpacing: -0.5,
  },
  periodRow: { flexDirection: 'row', gap: spacing.sm },
  periodBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  periodBtnActive:     { backgroundColor: SPORT_GREEN },
  periodBtnText:       { fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium, color: colors.textSecondary },
  periodBtnTextActive: { color: colors.surface, fontWeight: typography.fontWeights.bold },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  checkboxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  empty: { alignItems: 'center', paddingTop: spacing.xxxxl, gap: spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary },
  emptySub:   { fontSize: typography.fontSizes.md, color: colors.textSecondary },
});
