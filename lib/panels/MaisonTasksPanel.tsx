import { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getRooms,
  getRoomTasks,
  getProjects,
  updateRoomTaskStatus,
  updateRoomTaskShoppingItems,
  deleteRoomTask,
  type Room,
  type RoomTask,
  type RoomTaskStatus,
  type RoomProject,
  type RoomShoppingItem,
} from '../database';
import { colors, typography, spacing, radii, shadows } from '../theme';

type TaskWithRoom = RoomTask & { room: Room };
type ProjectWithRoom = RoomProject & { room: Room };

const COLUMNS: { status: RoomTaskStatus; label: string; color: string }[] = [
  { status: 'todo',        label: 'À planifier',    color: '#8FA3BF' },
  { status: 'preparing',   label: 'En préparation', color: '#F39C12' },
  { status: 'in_progress', label: 'En cours',       color: colors.house },
  { status: 'done',        label: 'Terminée',       color: colors.success },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  high:   { label: 'Urgent',    color: '#E74C3C' },
  normal: { label: 'Normal',    color: colors.textSecondary },
  low:    { label: 'Plus tard', color: '#27AE60' },
};

type ProjectFilter = { id: number; name: string; roomColor: string };

interface MaisonTasksPanelProps {
  width: number;
  isFocused: boolean;
  focusKey: number;
  projectFilter: ProjectFilter | null;
  onClearFilter: () => void;
}

const COL_WIDTH = 210;

// ─── Détail d'une tâche ───────────────────────────────────────

interface TaskDetailModalProps {
  task: TaskWithRoom;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

function TaskDetailModal({ task, onClose, onUpdated, onDeleted }: TaskDetailModalProps) {
  const [newItem, setNewItem] = useState('');
  const items: RoomShoppingItem[] = JSON.parse(task.shopping_items || '[]');
  const remaining = items.filter((i) => !i.done).length;

  function handleStatusChange(status: RoomTaskStatus) {
    updateRoomTaskStatus(task.id, status);
    onUpdated();
  }

  function handleDelete() {
    Alert.alert('Supprimer cette tâche ?', task.title, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: () => { deleteRoomTask(task.id); onDeleted(); },
      },
    ]);
  }

  function saveItems(updated: RoomShoppingItem[]) {
    updateRoomTaskShoppingItems(task.id, updated);
    onUpdated();
  }

  function addItem() {
    const name = newItem.trim();
    if (!name) return;
    saveItems([...items, { name, done: false }]);
    setNewItem('');
  }

  function toggleItem(i: number) {
    saveItems(items.map((it, idx) => idx === i ? { ...it, done: !it.done } : it));
  }

  function removeItem(i: number) {
    saveItems(items.filter((_, idx) => idx !== i));
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={detailStyles.root}>
        {/* Header coloré par la pièce */}
        <View style={[detailStyles.header, { backgroundColor: task.room.color }]}>
          <TouchableOpacity onPress={onClose} style={detailStyles.closeBtn}>
            <Text style={detailStyles.closeText}>‹ Fermer</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleDelete} style={detailStyles.deleteBtnHeader}>
            <Text style={detailStyles.deleteHeaderIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={detailStyles.body}
          contentContainerStyle={detailStyles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Titre */}
          <Text style={detailStyles.title}>{task.title}</Text>

          {/* Méta : pièce + priorité */}
          <View style={detailStyles.metaRow}>
            <View style={[detailStyles.roomBadge, { backgroundColor: task.room.color + '20', borderColor: task.room.color + '50' }]}>
              <Text style={[detailStyles.roomBadgeText, { color: task.room.color }]}>
                {task.room.icon} {task.room.name}
              </Text>
            </View>
            {task.priority !== 'normal' && (
              <Text style={[detailStyles.priorityLabel, { color: PRIORITY_CONFIG[task.priority]?.color }]}>
                {PRIORITY_CONFIG[task.priority]?.label}
              </Text>
            )}
          </View>

          {/* Note */}
          {!!task.note && (
            <View style={detailStyles.noteBox}>
              <Text style={detailStyles.note}>{task.note}</Text>
            </View>
          )}

          {/* Sélecteur de statut */}
          <Text style={detailStyles.sectionLabel}>Statut</Text>
          <View style={detailStyles.statusGrid}>
            {COLUMNS.map((col) => {
              const isActive = task.status === col.status;
              return (
                <TouchableOpacity
                  key={col.status}
                  style={[
                    detailStyles.statusBtn,
                    isActive && { backgroundColor: col.color, borderColor: col.color },
                  ]}
                  onPress={() => handleStatusChange(col.status)}
                  activeOpacity={0.75}
                >
                  <Text style={[detailStyles.statusBtnText, isActive && { color: colors.surface }]}>
                    {col.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section achats */}
          <Text style={detailStyles.sectionLabel}>
            {'Achats'}
            {items.length > 0 && (
              <Text style={{ color: remaining > 0 ? task.room.color : colors.success }}>
                {remaining > 0
                  ? `  ·  ${remaining} restant${remaining > 1 ? 's' : ''}`
                  : '  ·  tout acheté !'}
              </Text>
            )}
          </Text>

          {items.map((item, i) => (
            <View key={i} style={detailStyles.shopItem}>
              <TouchableOpacity
                style={[detailStyles.checkbox, item.done && { backgroundColor: colors.success, borderColor: colors.success }]}
                onPress={() => toggleItem(i)}
              >
                {item.done && <Text style={detailStyles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <Text style={[detailStyles.shopName, item.done && detailStyles.shopNameDone]} numberOfLines={2}>
                {item.name}
              </Text>
              <TouchableOpacity onPress={() => removeItem(i)} style={detailStyles.removeBtn}>
                <Text style={detailStyles.removeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={detailStyles.addRow}>
            <TextInput
              style={detailStyles.addInput}
              placeholder="Ajouter un article..."
              placeholderTextColor={colors.textSecondary}
              value={newItem}
              onChangeText={setNewItem}
              onSubmitEditing={addItem}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[detailStyles.addBtn, { backgroundColor: task.room.color }, !newItem.trim() && { opacity: 0.35 }]}
              onPress={addItem}
              disabled={!newItem.trim()}
            >
              <Text style={detailStyles.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Panel principal ──────────────────────────────────────────

export function MaisonTasksPanel({ width, isFocused, focusKey, projectFilter, onClearFilter }: MaisonTasksPanelProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithRoom[]>([]);
  const [boardHeight, setBoardHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Filtre interne (dropdown)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [allProjects, setAllProjects] = useState<ProjectWithRoom[]>([]);

  // Tâche sélectionnée (détail)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  // Sync depuis le filtre externe (bouton "Voir sur le tableau")
  useEffect(() => {
    setSelectedProjectId(projectFilter?.id ?? null);
  }, [projectFilter]);

  const loadData = useCallback(() => {
    const rooms = getRooms();
    const all: TaskWithRoom[] = [];
    for (const room of rooms) {
      for (const task of getRoomTasks(room.id)) {
        all.push({ ...task, room });
      }
    }
    setTasks(all);
  }, []);

  const loadProjects = useCallback(() => {
    const rooms = getRooms();
    const ps: ProjectWithRoom[] = [];
    for (const room of rooms) {
      for (const project of getProjects(room.id)) {
        ps.push({ ...project, room });
      }
    }
    setAllProjects(ps);
  }, []);

  useEffect(() => {
    if (isFocused) { loadData(); loadProjects(); }
  }, [isFocused, focusKey]);

  const visibleTasks = selectedProjectId !== null
    ? tasks.filter((t) => t.project_id === selectedProjectId)
    : tasks;

  const selectedProject = allProjects.find((p) => p.id === selectedProjectId) ?? null;

  // Grouper les projets par pièce pour le dropdown
  const roomGroups = allProjects.reduce<{ room: Room; projects: ProjectWithRoom[] }[]>((acc, p) => {
    const existing = acc.find((g) => g.room.id === p.room.id);
    if (existing) { existing.projects.push(p); } else { acc.push({ room: p.room, projects: [p] }); }
    return acc;
  }, []);

  function moveTask(taskId: number, direction: 'prev' | 'next') {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const colIdx = COLUMNS.findIndex((c) => c.status === task.status);
    const newIdx = direction === 'prev' ? colIdx - 1 : colIdx + 1;
    if (newIdx < 0 || newIdx >= COLUMNS.length) return;
    updateRoomTaskStatus(taskId, COLUMNS[newIdx].status);
    loadData();
  }

  function selectProject(id: number | null) {
    setSelectedProjectId(id);
    if (id === null) onClearFilter();
    setDropdownOpen(false);
  }

  const activeCount = visibleTasks.filter((t) => t.status !== 'done').length;

  return (
    <View style={[styles.root, { width }]} pointerEvents={isFocused ? 'auto' : 'none'}>

      {/* Header */}
      <View
        style={[styles.header, { paddingTop: insets.top + spacing.xxxl }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>🏠</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Tableau des tâches</Text>
            <Text style={styles.headerSub}>
              {activeCount === 0
                ? 'Tout est terminé !'
                : `${activeCount} tâche${activeCount > 1 ? 's' : ''} en cours`}
            </Text>
          </View>
        </View>

        {/* Bouton dropdown projet */}
        <TouchableOpacity
          style={[
            styles.dropdownBtn,
            selectedProject && { borderColor: selectedProject.room.color + '80', backgroundColor: selectedProject.room.color + '15' },
          ]}
          onPress={() => setDropdownOpen((o) => !o)}
          activeOpacity={0.75}
        >
          <Text
            style={[styles.dropdownBtnText, selectedProject && { color: selectedProject.room.color }]}
            numberOfLines={1}
          >
            📂 {selectedProject ? selectedProject.title : 'Tous les projets'}
          </Text>
          <Text style={[styles.dropdownBtnArrow, selectedProject && { color: selectedProject.room.color }]}>
            {dropdownOpen ? '▴' : '▾'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Board */}
      <View
        style={styles.boardContainer}
        onLayout={(e) => setBoardHeight(e.nativeEvent.layout.height)}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.board, { paddingBottom: insets.bottom + spacing.xl }]}
        >
          {COLUMNS.map((col, colIdx) => {
            const colTasks = visibleTasks.filter((t) => t.status === col.status);
            return (
              <View
                key={col.status}
                style={[styles.column, boardHeight > 0 && { height: boardHeight - spacing.lg * 2 }]}
              >
                <View style={[styles.colHeader, { borderTopColor: col.color }]}>
                  <Text style={[styles.colLabel, { color: col.color }]}>{col.label}</Text>
                  <View style={[styles.colBadge, { backgroundColor: col.color }]}>
                    <Text style={styles.colBadgeText}>{colTasks.length}</Text>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.colScroll}>
                  {colTasks.length === 0 && (
                    <View style={styles.emptyCol}>
                      <Text style={styles.emptyColText}>—</Text>
                    </View>
                  )}
                  {colTasks.map((task) => (
                    <TouchableOpacity
                      key={task.id}
                      style={[styles.card, task.status === 'done' && styles.cardDone]}
                      onPress={() => setSelectedTaskId(task.id)}
                      activeOpacity={0.8}
                    >
                      {task.priority === 'high' && <View style={styles.urgentBar} />}
                      <View style={styles.cardInner}>
                        <Text style={styles.cardTitle} numberOfLines={4}>{task.title}</Text>
                        {!!task.note && (
                          <Text style={styles.cardNote} numberOfLines={2}>{task.note}</Text>
                        )}
                        <View style={styles.cardMeta}>
                          <Text style={[styles.roomTag, { color: task.room.color }]} numberOfLines={1}>
                            {task.room.icon} {task.room.name}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.moveRow}>
                        <TouchableOpacity
                          style={[styles.moveBtn, colIdx === 0 && styles.moveBtnHidden]}
                          onPress={() => moveTask(task.id, 'prev')}
                          disabled={colIdx === 0}
                          activeOpacity={0.65}
                        >
                          <Text style={styles.moveBtnText}>‹</Text>
                        </TouchableOpacity>
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity
                          style={[styles.moveBtn, colIdx === COLUMNS.length - 1 && styles.moveBtnHidden]}
                          onPress={() => moveTask(task.id, 'next')}
                          disabled={colIdx === COLUMNS.length - 1}
                          activeOpacity={0.65}
                        >
                          <Text style={styles.moveBtnText}>›</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Dropdown overlay */}
      {dropdownOpen && (
        <>
          <TouchableOpacity
            style={[StyleSheet.absoluteFillObject, { top: headerHeight, zIndex: 10 }]}
            activeOpacity={1}
            onPress={() => setDropdownOpen(false)}
          />
          <View style={[styles.dropdownMenu, { top: headerHeight + 4 }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {/* Option "Tous" */}
              <TouchableOpacity
                style={[styles.dropdownItem, selectedProjectId === null && styles.dropdownItemActive]}
                onPress={() => selectProject(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownItemText, selectedProjectId === null && styles.dropdownItemTextActive]}>
                  Tous les projets
                </Text>
                {selectedProjectId === null && <Text style={styles.dropdownCheck}>✓</Text>}
              </TouchableOpacity>

              {allProjects.length === 0 && (
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.dropdownEmptyText}>Aucun projet créé</Text>
                </View>
              )}

              {/* Groupes par pièce */}
              {roomGroups.map(({ room, projects }) => (
                <View key={room.id}>
                  <View style={styles.dropdownGroupHeader}>
                    <Text style={[styles.dropdownGroupText, { color: room.color }]}>
                      {room.icon} {room.name}
                    </Text>
                  </View>
                  {projects.map((project) => (
                    <TouchableOpacity
                      key={project.id}
                      style={[
                        styles.dropdownItem,
                        styles.dropdownItemIndented,
                        selectedProjectId === project.id && styles.dropdownItemActive,
                      ]}
                      onPress={() => selectProject(project.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedProjectId === project.id && { color: room.color, fontWeight: typography.fontWeights.bold },
                        ]}
                        numberOfLines={1}
                      >
                        {project.title}
                      </Text>
                      {selectedProjectId === project.id && (
                        <Text style={[styles.dropdownCheck, { color: room.color }]}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      {/* Détail tâche */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={() => loadData()}
          onDeleted={() => { setSelectedTaskId(null); loadData(); }}
        />
      )}
    </View>
  );
}

// ─── Styles panel ─────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.dark,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  headerRow: {
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
  backBtnText: { fontSize: 20 },
  headerText: { flex: 1 },
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

  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
  },
  dropdownBtnText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.surface,
  },
  dropdownBtnArrow: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.bold,
  },

  dropdownMenu: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    zIndex: 11,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  dropdownItemIndented: {
    paddingLeft: spacing.xl + spacing.md,
  },
  dropdownItemActive: {
    backgroundColor: colors.background,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  dropdownItemTextActive: {
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  dropdownCheck: {
    fontSize: 14,
    color: colors.success,
    fontWeight: typography.fontWeights.bold,
  },
  dropdownGroupHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dropdownGroupText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dropdownEmpty: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dropdownEmptyText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  boardContainer: { flex: 1 },
  board: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    width: COL_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  colLabel: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  colBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colBadgeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.surface,
    fontWeight: typography.fontWeights.bold,
  },
  colScroll: { padding: spacing.sm, gap: spacing.sm },
  emptyCol: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyColText: { fontSize: typography.fontSizes.lg, color: colors.border },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDone: { opacity: 0.5 },
  urgentBar: { height: 3, backgroundColor: '#E74C3C' },
  cardInner: { padding: spacing.md, gap: spacing.xs },
  cardTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  cardNote: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  roomTag: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  moveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  moveBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border + '80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveBtnHidden: { opacity: 0 },
  moveBtnText: {
    fontSize: 26,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.bold,
    lineHeight: 30,
  },
});

// ─── Styles détail tâche ───────────────────────────────────────

const detailStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  closeBtn: { paddingVertical: spacing.xs, paddingRight: spacing.md },
  closeText: {
    color: colors.surface,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semiBold,
    opacity: 0.95,
  },
  deleteBtnHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteHeaderIcon: { fontSize: 18 },

  body: { flex: 1 },
  bodyContent: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxxl },

  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    lineHeight: 30,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  roomBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  roomBadgeText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
  },
  priorityLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
  },

  noteBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  note: {
    fontSize: typography.fontSizes.md,
    color: colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  sectionLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: -spacing.xs,
  },

  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statusBtnText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },

  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: { fontSize: 13, color: colors.surface, fontWeight: typography.fontWeights.bold },
  shopName: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  shopNameDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  removeBtn: { padding: spacing.sm },
  removeIcon: { fontSize: 13, color: colors.textSecondary },

  addRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  addInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSizes.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 24,
    color: colors.surface,
    fontWeight: typography.fontWeights.bold,
    lineHeight: 26,
  },
});
