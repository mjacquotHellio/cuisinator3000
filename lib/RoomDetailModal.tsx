import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  deleteRoom,
  getProjectTaskCounts,
  type Room,
  type RoomProject,
} from './database';
import { colors, typography, spacing, radii, shadows } from './theme';
import { ProjectDetailModal } from './ProjectDetailModal';

type ProjectWithCounts = RoomProject & { total: number; done: number };

interface RoomDetailModalProps {
  visible: boolean;
  room: Room;
  onClose: () => void;
  onGotoBoard: (projectId: number, projectTitle: string, roomColor: string) => void;
}

export function RoomDetailModal({ visible, room, onClose, onGotoBoard }: RoomDetailModalProps) {
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedProject, setSelectedProject] = useState<RoomProject | null>(null);

  // État pour l'édition d'un projet existant
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const loadProjects = useCallback(() => {
    const ps = getProjects(room.id);
    setProjects(ps.map((p) => ({ ...p, ...getProjectTaskCounts(p.id) })));
  }, [room.id]);

  useEffect(() => {
    if (visible) {
      loadProjects();
      setShowForm(false);
      setNewTitle('');
      setNewDesc('');
      setSelectedProject(null);
      setEditingProjectId(null);
    }
  }, [visible, loadProjects]);

  function handleAddProject() {
    if (!newTitle.trim()) return;
    addProject({
      room_id: room.id,
      title: newTitle.trim(),
      description: newDesc.trim(),
      created_at: new Date().toISOString(),
    });
    setNewTitle('');
    setNewDesc('');
    setShowForm(false);
    loadProjects();
  }

  function handleStartEdit(project: RoomProject) {
    setEditingProjectId(project.id);
    setEditTitle(project.title);
    setEditDesc(project.description || '');
  }

  function handleSaveEdit() {
    if (!editTitle.trim() || !editingProjectId) return;
    updateProject(editingProjectId, { title: editTitle.trim(), description: editDesc.trim() });
    setEditingProjectId(null);
    loadProjects();
  }

  function handleDeleteProject(id: number) {
    Alert.alert(
      'Supprimer ce projet ?',
      'Toutes les tâches de ce projet seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => { deleteProject(id); loadProjects(); } },
      ]
    );
  }

  function handleDeleteRoom() {
    Alert.alert(
      `Supprimer "${room.name}" ?`,
      'Tous les projets et tâches seront supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => { deleteRoom(room.id); onClose(); } },
      ]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: room.color }]}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Retour</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerIcon}>{room.icon}</Text>
            <Text style={styles.headerTitle}>{room.name}</Text>
            <Text style={styles.headerSub}>
              {projects.length === 0
                ? 'Aucun projet'
                : `${projects.length} projet${projects.length > 1 ? 's' : ''}`}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDeleteRoom} style={styles.deleteRoomBtn}>
            <Text style={styles.deleteRoomIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {/* Liste des projets */}
        <ScrollView style={styles.body} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

          {/* Formulaire de création */}
          {showForm && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Nouveau projet</Text>
              <TextInput
                style={styles.input}
                placeholder="Titre du projet..."
                placeholderTextColor={colors.textSecondary}
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
              />
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Description (optionnel)..."
                placeholderTextColor={colors.textSecondary}
                value={newDesc}
                onChangeText={setNewDesc}
                multiline
                numberOfLines={2}
              />
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowForm(false); setNewTitle(''); setNewDesc(''); }}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: room.color }, !newTitle.trim() && styles.saveBtnDisabled]}
                  onPress={handleAddProject}
                  disabled={!newTitle.trim()}
                >
                  <Text style={styles.saveBtnText}>Créer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* État vide */}
          {projects.length === 0 && !showForm && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>Aucun projet pour cette pièce</Text>
              <Text style={styles.emptySub}>Créez votre premier projet pour organiser vos tâches</Text>
            </View>
          )}

          {/* Cartes de projets */}
          {projects.map((project) => {
            // Mode édition inline
            if (editingProjectId === project.id) {
              return (
                <View key={project.id} style={styles.form}>
                  <Text style={styles.formTitle}>Modifier le projet</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Titre du projet..."
                    placeholderTextColor={colors.textSecondary}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    autoFocus
                  />
                  <TextInput
                    style={[styles.input, styles.inputMulti]}
                    placeholder="Description (optionnel)..."
                    placeholderTextColor={colors.textSecondary}
                    value={editDesc}
                    onChangeText={setEditDesc}
                    multiline
                    numberOfLines={2}
                  />
                  <View style={styles.formActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingProjectId(null)}>
                      <Text style={styles.cancelText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: room.color }, !editTitle.trim() && styles.saveBtnDisabled]}
                      onPress={handleSaveEdit}
                      disabled={!editTitle.trim()}
                    >
                      <Text style={styles.saveBtnText}>Sauvegarder</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            const progress = project.total > 0 ? project.done / project.total : 0;
            const isDone = project.total > 0 && project.done === project.total;
            return (
              <TouchableOpacity
                key={project.id}
                style={styles.projectCard}
                onPress={() => setSelectedProject(project)}
                activeOpacity={0.75}
              >
                <View style={[styles.projectAccent, { backgroundColor: room.color }]} />
                <View style={styles.projectCardBody}>
                  <View style={styles.projectCardTop}>
                    <Text style={styles.projectTitle} numberOfLines={1}>{project.title}</Text>
                    <TouchableOpacity
                      onPress={() => handleStartEdit(project)}
                      style={styles.editProjectBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.editProjectIcon}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteProject(project.id)}
                      style={styles.deleteProjectBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.deleteProjectIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {!!project.description && (
                    <Text style={styles.projectDesc} numberOfLines={2}>{project.description}</Text>
                  )}

                  {project.total > 0 ? (
                    <View style={styles.projectProgressRow}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progress * 100}%` as any, backgroundColor: isDone ? colors.success : room.color },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressText, { color: isDone ? colors.success : room.color }]}>
                        {isDone ? '✓ Terminé' : `${project.done}/${project.total}`}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noTasks}>Aucune tâche · Appuyer pour commencer</Text>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer */}
        {!showForm && !editingProjectId && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: room.color }]}
              onPress={() => setShowForm(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.addBtnText}>+ Nouveau projet</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {selectedProject && (
        <ProjectDetailModal
          visible
          project={selectedProject}
          room={room}
          onClose={() => { setSelectedProject(null); loadProjects(); }}
          onGotoBoard={(projectId, projectTitle) => {
            onClose();
            onGotoBoard(projectId, projectTitle, room.color);
          }}
        />
      )}
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backBtn: { paddingTop: spacing.xs },
  backText: {
    color: colors.surface,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semiBold,
    opacity: 0.9,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerIcon: { fontSize: 36, marginBottom: spacing.xs },
  headerTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.surface,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
  },
  deleteRoomBtn: { paddingTop: spacing.xs },
  deleteRoomIcon: { fontSize: 20 },

  body: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxxl },

  // Formulaire
  form: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.md,
  },
  formTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSizes.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  inputMulti: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  formActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: typography.fontSizes.md,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.surface,
  },

  // État vide
  empty: { alignItems: 'center', paddingTop: spacing.xxxxl + spacing.xl, gap: spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },

  // Carte projet
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  projectAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  projectCardBody: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  projectCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  projectTitle: {
    flex: 1,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  editProjectBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.houseLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProjectIcon: {
    fontSize: 13,
    color: colors.house,
    fontWeight: typography.fontWeights.bold,
  },
  deleteProjectBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteProjectIcon: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: typography.fontWeights.bold,
  },
  projectDesc: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  projectProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: radii.full,
  },
  progressText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  noTasks: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
    paddingRight: spacing.lg,
  },

  // Footer
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  addBtn: {
    borderRadius: radii.full,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.surface,
  },
});
