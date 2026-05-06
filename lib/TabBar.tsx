import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from './theme';

export type TabDef = {
  label: string;
  icon: string;
  activeColor: string;
};

interface TabBarProps {
  tabs: TabDef[];
  activeTab: number;
  onSwitch: (index: number) => void;
}

export function TabBar({ tabs, activeTab, onSwitch }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {tabs.map((tab, i) => {
        const active = i === activeTab;
        return (
          <Pressable
            key={tab.label}
            style={({ pressed }) => [styles.tab, pressed && !active && styles.tabPressed]}
            onPress={() => { if (!active) onSwitch(i); }}
          >
            {active && <View style={[styles.activeIndicator, { backgroundColor: tab.activeColor }]} />}
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text style={[styles.label, active && { fontWeight: typography.fontWeights.bold, color: tab.activeColor }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 2,
  },
  tabPressed: {
    opacity: 0.45,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
});
