import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing, radii, shadows } from './theme';
import type { SportSession } from './types';

const SPORT_GREEN = '#22C55E';

interface SportSessionModalProps {
  visible: boolean;
  initial?: SportSession | null;
  date: string;
  onClose: () => void;
  onSave: (session: SportSession) => void;
}

export function SportSessionModal({ visible, initial, date, onClose, onSave }: SportSessionModalProps) {
  const [pushUps, setPushUps] = useState('');
  const [kneePushUps, setKneePushUps] = useState('');
  const [abs, setAbs] = useState('');
  const [timeMin, setTimeMin] = useState('');
  const [timeSec, setTimeSec] = useState('');

  useEffect(() => {
    if (visible) {
      setPushUps(initial ? String(initial.push_ups) : '');
      setKneePushUps(initial ? String(initial.knee_push_ups) : '');
      setAbs(initial ? String(initial.abs) : '');
      if (initial && initial.total_time > 0) {
        setTimeMin(String(Math.floor(initial.total_time / 60)));
        setTimeSec(String(initial.total_time % 60));
      } else {
        setTimeMin('');
        setTimeSec('');
      }
    }
  }, [visible, initial]);

  function handleSave() {
    const totalSeconds = (parseInt(timeMin) || 0) * 60 + (parseInt(timeSec) || 0);
    onSave({
      date,
      push_ups: parseInt(pushUps) || 0,
      knee_push_ups: parseInt(kneePushUps) || 0,
      abs: parseInt(abs) || 0,
      total_time: totalSeconds,
    });
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.root}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={s.header}>
            <Text style={s.title}>Ma perf du jour 🏋️</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn} activeOpacity={0.7}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <Field
              icon="💪"
              label="Pompes normales"
              value={pushUps}
              onChange={setPushUps}
            />
            <Field
              icon="🦵"
              label="Pompes sur les genoux"
              value={kneePushUps}
              onChange={setKneePushUps}
            />
            <Field
              icon="🔥"
              label="Abdominaux"
              value={abs}
              onChange={setAbs}
            />
            <TimeField
              minutes={timeMin}
              seconds={timeSec}
              onMinutesChange={setTimeMin}
              onSecondsChange={setTimeSec}
            />
          </ScrollView>

          <View style={s.footer}>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={s.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.field}>
      <View style={s.fieldHeader}>
        <Text style={s.fieldIcon}>{icon}</Text>
        <Text style={s.fieldLabel}>{label}</Text>
      </View>
      <TextInput
        style={s.fieldInput}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.border}
        selectTextOnFocus
      />
    </View>
  );
}

function TimeField({
  minutes,
  seconds,
  onMinutesChange,
  onSecondsChange,
}: {
  minutes: string;
  seconds: string;
  onMinutesChange: (v: string) => void;
  onSecondsChange: (v: string) => void;
}) {
  return (
    <View style={s.field}>
      <View style={s.fieldHeader}>
        <Text style={s.fieldIcon}>⏱</Text>
        <Text style={s.fieldLabel}>Temps total</Text>
      </View>
      <View style={s.timeRow}>
        <View style={s.timeUnit}>
          <TextInput
            style={s.fieldInput}
            value={minutes}
            onChangeText={onMinutesChange}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.border}
            selectTextOnFocus
          />
          <Text style={s.timeUnitLabel}>min</Text>
        </View>
        <Text style={s.timeSep}>:</Text>
        <View style={s.timeUnit}>
          <TextInput
            style={s.fieldInput}
            value={seconds}
            onChangeText={(v) => {
              const n = parseInt(v);
              if (v === '' || (n >= 0 && n <= 59)) onSecondsChange(v);
            }}
            keyboardType="numeric"
            placeholder="00"
            placeholderTextColor={colors.border}
            selectTextOnFocus
            maxLength={2}
          />
          <Text style={s.timeUnitLabel}>sec</Text>
        </View>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.surface,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: typography.fontWeights.bold,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  field: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.sm,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldIcon: {
    fontSize: 20,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textPrimary,
  },
  fieldInput: {
    fontSize: 36,
    fontWeight: typography.fontWeights.extraBold,
    color: SPORT_GREEN,
    borderBottomWidth: 2,
    borderBottomColor: SPORT_GREEN + '55',
    paddingBottom: spacing.sm,
    minWidth: 60,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  timeUnit: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  timeSep: {
    fontSize: 36,
    fontWeight: typography.fontWeights.extraBold,
    color: SPORT_GREEN,
    paddingBottom: spacing.sm + 2,
  },
  timeUnitLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  footer: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxxl,
  },
  saveBtn: {
    backgroundColor: SPORT_GREEN,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    shadowColor: SPORT_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.surface,
  },
});
