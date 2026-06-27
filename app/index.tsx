import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii, shadows } from '../lib/theme';

const SPORT_GREEN = '#22C55E';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.appName}>Maisontator 3000</Text>
          <Text style={styles.question}>De quoi veux-tu{'\n'}t'occuper ?</Text>
        </View>

        <View style={styles.cards}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/planning')}
            activeOpacity={0.82}
          >
            <View style={[styles.cardIconBox, styles.cardIconBoxPlanning]}>
              <Text style={styles.cardEmoji}>📅</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Planning de la semaine</Text>
              <Text style={styles.cardSub}>Repas, recettes et liste de courses</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardMaison]}
            onPress={() => router.push('/maison')}
            activeOpacity={0.82}
          >
            <View style={[styles.cardIconBox, styles.cardIconBoxMaison]}>
              <Text style={styles.cardEmoji}>🏠</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.house }]}>Ma Maison</Text>
              <Text style={styles.cardSub}>Tâches et achats par pièce</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardSport]}
            onPress={() => router.push('/sport')}
            activeOpacity={0.82}
          >
            <View style={[styles.cardIconBox, styles.cardIconBoxSport]}>
              <Text style={styles.cardEmoji}>🏋️</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: SPORT_GREEN }]}>Sport</Text>
              <Text style={styles.cardSub}>Suivi de tes performances</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
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
    paddingTop: spacing.xxxxl,
    paddingBottom: spacing.xxxxl,
  },
  appName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  question: {
    fontSize: 32,
    fontWeight: typography.fontWeights.extraBold,
    color: colors.surface,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  cards: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    ...shadows.md,
  },
  cardMaison: {
    borderLeftWidth: 3,
    borderLeftColor: colors.house,
  },
  cardSport: {
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
  },
  cardIconBox: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardIconBoxPlanning: {
    backgroundColor: colors.primaryLight,
  },
  cardIconBoxMaison: {
    backgroundColor: colors.house + '22',
  },
  cardIconBoxSport: {
    backgroundColor: '#22C55E22',
  },
  cardEmoji: {
    fontSize: 26,
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  cardSub: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 28,
    color: colors.textSecondary,
  },
});
