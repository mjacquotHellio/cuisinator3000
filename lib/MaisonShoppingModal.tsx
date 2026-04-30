import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  getAllRoomShoppingItems,
  updateRoomTaskShoppingItems,
  type RoomShoppingEntry,
  type RoomShoppingItem,
} from './database';
import { colors, typography, spacing, radii, shadows } from './theme';

interface MaisonShoppingModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MaisonShoppingModal({ visible, onClose }: MaisonShoppingModalProps) {
  const [entries, setEntries] = useState<RoomShoppingEntry[]>([]);

  const loadData = useCallback(() => {
    setEntries(getAllRoomShoppingItems());
  }, []);

  useEffect(() => {
    if (visible) loadData();
  }, [visible, loadData]);

  function toggleItem(entry: RoomShoppingEntry, itemIndex: number) {
    const updated: RoomShoppingItem[] = entry.items.map((it, i) =>
      i === itemIndex ? { ...it, done: !it.done } : it
    );
    updateRoomTaskShoppingItems(entry.taskId, updated);
    loadData();
  }

  const totalItems = entries.reduce((acc, e) => acc + e.items.length, 0);
  const doneItems = entries.reduce((acc, e) => acc + e.items.filter((i) => i.done).length, 0);
  const remaining = totalItems - doneItems;

  // Grouper par pièce
  const byRoom = entries.reduce<Record<number, RoomShoppingEntry[]>>((acc, entry) => {
    if (!acc[entry.roomId]) acc[entry.roomId] = [];
    acc[entry.roomId].push(entry);
    return acc;
  }, {});

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Courses Maison</Text>
            <Text style={styles.headerSub}>
              {totalItems === 0
                ? 'Aucun article à acheter'
                : remaining === 0
                  ? 'Tout est acheté !'
                  : `${remaining} article${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`}
            </Text>
          </View>
          {totalItems > 0 && (
            <View style={[styles.headerBadge, remaining === 0 && styles.headerBadgeDone]}>
              <Text style={styles.headerBadgeText}>{doneItems}/{totalItems}</Text>
            </View>
          )}
        </View>

        {/* Barre de progression */}
        {totalItems > 0 && (
          <View style={styles.progressWrap}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(doneItems / totalItems) * 100}%` as any }]} />
            </View>
          </View>
        )}

        {/* Liste */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {totalItems === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🛒</Text>
              <Text style={styles.emptyTitle}>Aucun article</Text>
              <Text style={styles.emptySub}>
                Ajoute des articles à tes tâches depuis le détail de chaque pièce
              </Text>
            </View>
          ) : (
            Object.values(byRoom).map((roomEntries) => {
              const first = roomEntries[0];
              return (
                <View key={first.roomId} style={styles.roomSection}>
                  {/* En-tête de pièce */}
                  <View style={[styles.roomHeader, { borderLeftColor: first.roomColor }]}>
                    <Text style={styles.roomIcon}>{first.roomIcon}</Text>
                    <Text style={[styles.roomName, { color: first.roomColor }]}>{first.roomName}</Text>
                  </View>

                  {/* Tâches de la pièce */}
                  {roomEntries.map((entry) => (
                    <View key={entry.taskId} style={styles.taskGroup}>
                      <Text style={styles.taskLabel}>
                        {TASK_TYPE_ICON[entry.taskTitle] ?? '📌'} {entry.taskTitle}
                      </Text>
                      {entry.items.map((item, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.itemRow}
                          onPress={() => toggleItem(entry, i)}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.checkbox,
                            item.done && { backgroundColor: colors.success, borderColor: colors.success },
                          ]}>
                            {item.done && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                          <Text style={[styles.itemName, item.done && styles.itemNameDone]}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Petite heuristique pour ajouter un emoji devant le titre de la tâche
const TASK_TYPE_ICON: Record<string, string> = {};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.dark,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: colors.surface, fontSize: 16, fontWeight: typography.fontWeights.bold },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.surface,
  },
  headerSub: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  headerBadge: {
    backgroundColor: colors.house,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerBadgeDone: { backgroundColor: colors.success },
  headerBadgeText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.surface,
  },
  progressWrap: {
    backgroundColor: colors.dark,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  progressBar: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radii.full, overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: colors.house, borderRadius: radii.full },
  body: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxxl },
  empty: { alignItems: 'center', paddingTop: spacing.xxxxl * 2, gap: spacing.md },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary },
  emptySub: {
    fontSize: typography.fontSizes.sm, color: colors.textSecondary,
    textAlign: 'center', paddingHorizontal: spacing.xl, lineHeight: 20,
  },

  // Sections par pièce
  roomSection: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  roomHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderLeftWidth: 4,
    backgroundColor: colors.background,
  },
  roomIcon: { fontSize: 20 },
  roomName: { fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold },

  // Groupe par tâche
  taskGroup: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  taskLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },

  // Articles
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  checkmark: { fontSize: 13, color: colors.surface, fontWeight: typography.fontWeights.bold },
  itemName: { flex: 1, fontSize: typography.fontSizes.md, color: colors.textPrimary },
  itemNameDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
});
