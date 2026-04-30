import { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getAllRoomShoppingItems,
  updateRoomTaskShoppingItems,
  type RoomShoppingEntry,
} from '../database';
import { colors, typography, spacing, radii, shadows } from '../theme';

interface MaisonCoursesPanelProps {
  width: number;
  isFocused: boolean;
  focusKey: number;
}

export function MaisonCoursesPanel({ width, isFocused, focusKey }: MaisonCoursesPanelProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [entries, setEntries] = useState<RoomShoppingEntry[]>([]);

  const loadData = useCallback(() => {
    setEntries(getAllRoomShoppingItems());
  }, []);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, focusKey]);

  function toggleItem(entry: RoomShoppingEntry, itemIndex: number) {
    const newItems = entry.items.map((it, i) =>
      i === itemIndex ? { ...it, done: !it.done } : it
    );
    updateRoomTaskShoppingItems(entry.taskId, newItems);
    loadData();
  }

  const totalCount = entries.reduce((acc, e) => acc + e.items.length, 0);
  const doneCount = entries.reduce((acc, e) => acc + e.items.filter((i) => i.done).length, 0);

  return (
    <View style={[styles.root, { width }]} pointerEvents={isFocused ? 'auto' : 'none'}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>🏠</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Courses maison</Text>
            <Text style={styles.headerSub}>
              {totalCount === 0
                ? 'Aucun article'
                : `${doneCount}/${totalCount} articles`}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>Aucun article à acheter</Text>
            <Text style={styles.emptyHint}>Les articles de tes tâches apparaîtront ici</Text>
          </View>
        ) : (
          entries.map((entry) => (
            <View key={`${entry.roomId}-${entry.taskId}`} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={[styles.roomDot, { backgroundColor: entry.roomColor }]} />
                <Text style={[styles.groupRoom, { color: entry.roomColor }]}>
                  {entry.roomIcon} {entry.roomName}
                </Text>
                <Text style={styles.groupTask} numberOfLines={1}>{entry.taskTitle}</Text>
              </View>
              {entry.items.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.item}
                  onPress={() => toggleItem(entry, idx)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, item.done && { backgroundColor: entry.roomColor, borderColor: entry.roomColor }]}>
                    {item.done && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.itemName, item.done && styles.itemDone]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    lineHeight: 24,
  },
  headerText: {
    flex: 1,
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
  body: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: spacing.sm,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: {
    fontSize: typography.fontSizes.md,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.semiBold,
  },
  emptyHint: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  roomDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  groupRoom: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupTask: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: {
    fontSize: 12,
    color: colors.surface,
    fontWeight: typography.fontWeights.bold,
  },
  itemName: {
    fontSize: typography.fontSizes.md,
    color: colors.textPrimary,
    flex: 1,
  },
  itemDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
});
