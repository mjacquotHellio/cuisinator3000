import { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { colors } from '../lib/theme';
import { TabBar, type TabDef } from '../lib/TabBar';
import { SportStatsPanel } from '../lib/panels/SportStatsPanel';
import { SportTodayPanel } from '../lib/panels/SportTodayPanel';
import { SportProgressPanel } from '../lib/panels/SportProgressPanel';

const SPORT_GREEN = '#22C55E';

const SPORT_TABS: TabDef[] = [
  { label: 'Bilan', icon: '📊', activeColor: SPORT_GREEN },
  { label: "Auj'hui", icon: '🏋️', activeColor: SPORT_GREEN },
  { label: 'Suivi', icon: '📈', activeColor: SPORT_GREEN },
];

export default function SportScreen() {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState(1); // Démarre sur Aujourd'hui
  const [focusKey, setFocusKey] = useState(0);
  const translateX = useRef(new Animated.Value(-width)).current; // tab 1 = -width

  useFocusEffect(
    useCallback(() => {
      setFocusKey((k) => k + 1);
    }, [])
  );

  function switchTab(newTab: number) {
    if (newTab === activeTab) return;
    Animated.timing(translateX, {
      toValue: -newTab * width,
      duration: 260,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
    setActiveTab(newTab);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
      <View style={styles.container}>
        <Animated.View
          style={[styles.panelRow, { width: width * 3, transform: [{ translateX }] }]}
        >
          <SportStatsPanel
            width={width}
            isFocused={activeTab === 0}
            focusKey={focusKey}
            onGoMain={() => switchTab(1)}
          />
          <SportTodayPanel
            width={width}
            isFocused={activeTab === 1}
            focusKey={focusKey}
          />
          <SportProgressPanel
            width={width}
            isFocused={activeTab === 2}
            focusKey={focusKey}
            onGoMain={() => switchTab(1)}
          />
        </Animated.View>
        <TabBar tabs={SPORT_TABS} activeTab={activeTab} onSwitch={switchTab} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  panelRow: {
    flex: 1,
    flexDirection: 'row',
  },
});
