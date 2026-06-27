import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getAllSportSessions, setSportSession } from '../database';
import { colors, typography, spacing, radii, shadows } from '../theme';
import { SportSessionModal } from '../SportSessionModal';
import type { SportSession } from '../types';

const SPORT_GREEN = '#22C55E';
const SPORT_AMBER = '#F59E0B';
const SPORT_RED   = '#EF4444';
const SPORT_BLUE  = '#3B82F6';

const DAYS_FR   = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                   'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const DAYS_SHOWN = 14;

function getDateStr(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
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

function formatTimeDiff(diff: number): string {
  const abs = Math.abs(diff);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}min`;
  return `${m}m${s}s`;
}

// ─── Tuile métrique ───────────────────────────────────────────

function MetricTile({
  icon, label, value, color,
}: {
  icon: string; label: string; value: string; color: string;
}) {
  return (
    <View style={[tile.root, { borderTopColor: color }]}>
      <Text style={tile.icon}>{icon}</Text>
      <Text style={[tile.value, { color }]}>{value}</Text>
      <Text style={tile.label}>{label}</Text>
    </View>
  );
}

const tile = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderTopWidth: 3,
  },
  icon:  { fontSize: 20 },
  value: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.extraBold,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});

// ─── Diff vs veille ───────────────────────────────────────────

function DiffStrip({
  current, previous,
}: {
  current: SportSession; previous: SportSession;
}) {
  const diffs: { icon: string; label: string; diff: number; fmt?: (v: number) => string }[] = [
    {
      icon: '💪', label: 'pompes',
      diff: (current.push_ups + current.knee_push_ups) - (previous.push_ups + previous.knee_push_ups),
    },
    { icon: '🔥', label: 'abdos', diff: current.abs - previous.abs },
    { icon: '⏱', label: 'temps', diff: current.total_time - previous.total_time, fmt: formatTimeDiff },
  ];

  return (
    <View style={di.strip}>
      <Text style={di.title}>Vs veille</Text>
      <View style={di.row}>
        {diffs.map(({ icon, label, diff, fmt }) => {
          const c = diff > 0 ? SPORT_GREEN : diff < 0 ? SPORT_RED : colors.textSecondary;
          const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '=';
          const fmtFn = fmt ?? String;
          return (
            <View key={label} style={di.item}>
              <Text style={di.itemIcon}>{icon}</Text>
              <Text style={[di.itemDiff, { color: c }]}>
                {diff !== 0 ? `${arrow} ${fmtFn(Math.abs(diff))}` : '—'}
              </Text>
              <Text style={di.itemLabel}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const di = StyleSheet.create({
  strip: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  item: { alignItems: 'center', gap: 2 },
  itemIcon: { fontSize: 14 },
  itemDiff: { fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold },
  itemLabel: { fontSize: typography.fontSizes.xs, color: colors.textSecondary },
});

// ─── Card d'un jour ───────────────────────────────────────────

interface DayEntry {
  date: string;
  isToday: boolean;
  session: SportSession | null;
  previousSession: SportSession | null; // session du jour précédent
}

function DayCard({
  entry,
  panelWidth,
  onEdit,
}: {
  entry: DayEntry;
  panelWidth: number;
  onEdit: () => void;
}) {
  const { date, isToday, session, previousSession } = entry;
  const dateLabel = isToday ? 'Aujourd\'hui' : formatDateLong(date);

  return (
    <View style={[dc.root, { width: panelWidth }]}>
      <View style={dc.card}>
        {/* Titre du jour */}
        <View style={dc.dateRow}>
          <Text style={[dc.dateMain, isToday && { color: SPORT_GREEN }]}>{dateLabel}</Text>
          {isToday && <View style={dc.todayDot} />}
        </View>
        {!isToday && (
          <Text style={dc.dateSub}>{formatDateLong(date)}</Text>
        )}

        {session ? (
          <>
            {/* Grille 2×2 */}
            <View style={dc.grid}>
              <View style={dc.gridRow}>
                <MetricTile icon="💪" label="Pompes" value={String(session.push_ups)} color={SPORT_GREEN} />
                <MetricTile icon="🦵" label="Genoux"  value={String(session.knee_push_ups)} color={SPORT_AMBER} />
              </View>
              <View style={dc.gridRow}>
                <MetricTile icon="🔥" label="Abdos"  value={String(session.abs)} color={SPORT_RED} />
                <MetricTile icon="⏱" label="Temps"  value={formatTime(session.total_time)} color={SPORT_BLUE} />
              </View>
            </View>

            {/* Total pompes */}
            <View style={dc.totalRow}>
              <Text style={dc.totalLabel}>Total pompes</Text>
              <Text style={[dc.totalValue, { color: SPORT_GREEN }]}>
                {session.push_ups + session.knee_push_ups}
              </Text>
            </View>

            {/* Diff vs veille */}
            {previousSession && (
              <DiffStrip current={session} previous={previousSession} />
            )}

            {/* Modifier si aujourd'hui */}
            {isToday && (
              <TouchableOpacity style={dc.modifyBtn} onPress={onEdit} activeOpacity={0.8}>
                <Text style={dc.modifyBtnText}>✏️  Modifier</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={dc.empty}>
            <Text style={dc.emptyEmoji}>{isToday ? '🏋️' : '😴'}</Text>
            <Text style={dc.emptyText}>
              {isToday ? 'Pas encore renseigné' : 'Repos'}
            </Text>

            {isToday && (
              <TouchableOpacity style={dc.enterBtn} onPress={onEdit} activeOpacity={0.8}>
                <Text style={dc.enterBtnText}>💪  Renseigner ma perf</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const dc = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadows.md,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SPORT_GREEN,
  },
  dateMain: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  dateSub: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: -spacing.md,
    fontWeight: typography.fontWeights.medium,
  },
  grid: { gap: spacing.sm },
  gridRow: { flexDirection: 'row', gap: spacing.sm },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: SPORT_GREEN + '12',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: SPORT_GREEN + '25',
  },
  totalLabel: {
    fontSize: typography.fontSizes.sm,
    color: SPORT_GREEN,
    fontWeight: typography.fontWeights.semiBold,
  },
  totalValue: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.extraBold,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.lg,
  },
  emptyEmoji: { fontSize: 52 },
  emptyText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textSecondary,
  },
  enterBtn: {
    backgroundColor: SPORT_GREEN,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    shadowColor: SPORT_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  enterBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.surface,
  },
  modifyBtn: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modifyBtnText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textSecondary,
  },
});

// ─── Panel principal ──────────────────────────────────────────

interface SportTodayPanelProps {
  width: number;
  isFocused: boolean;
  focusKey: number;
}

export function SportTodayPanel({ width, isFocused, focusKey }: SportTodayPanelProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatRef = useRef<FlatList>(null);
  const [sessions, setSessions] = useState<SportSession[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = useCallback(() => {
    setSessions(getAllSportSessions());
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadData();
      // Revenir à aujourd'hui à chaque focus
      setCurrentIndex(0);
      flatRef.current?.scrollToIndex({ index: 0, animated: false });
    }
  }, [isFocused, focusKey]);

  // Construire les entrées des DAYS_SHOWN derniers jours
  const sessionByDate = new Map(sessions.map((s) => [s.date, s]));

  const entries: DayEntry[] = Array.from({ length: DAYS_SHOWN }, (_, i) => {
    const date = getDateStr(-i);
    const prevDate = getDateStr(-i - 1);
    return {
      date,
      isToday: i === 0,
      session: sessionByDate.get(date) ?? null,
      previousSession: sessionByDate.get(prevDate) ?? null,
    };
  });

  const currentEntry = entries[currentIndex];

  function handleSave(session: SportSession) {
    setSportSession(session);
    setModalVisible(false);
    loadData();
  }

  const headerDate = currentEntry.isToday
    ? "Aujourd'hui"
    : formatDateLong(currentEntry.date);

  return (
    <View style={[s.root, { width }]} pointerEvents={isFocused ? 'auto' : 'none'}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + spacing.xl }]}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.replace('/')} style={s.homeBtn} activeOpacity={0.7}>
            <Text style={s.homeBtnText}>🏠</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>Sport</Text>
            <Text style={s.headerSub}>{headerDate}</Text>
          </View>
        </View>
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatRef}
        data={entries}
        keyExtractor={(item) => item.date}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <DayCard
            entry={item}
            panelWidth={width}
            onEdit={() => setModalVisible(true)}
          />
        )}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        initialScrollIndex={0}
      />

      {/* Dots */}
      <View style={s.dots}>
        {entries.map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              i === currentIndex && s.dotActive,
              i === 0 && s.dotToday,
              i === 0 && i === currentIndex && s.dotTodayActive,
            ]}
          />
        ))}
      </View>

      <SportSessionModal
        visible={modalVisible}
        initial={currentEntry?.session}
        date={currentEntry?.date ?? getDateStr(0)}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
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
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  homeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  homeBtnText: { fontSize: 18 },
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
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.textSecondary,
  },
  dotToday: {
    backgroundColor: SPORT_GREEN + '55',
  },
  dotTodayActive: {
    width: 18,
    backgroundColor: SPORT_GREEN,
  },
});
