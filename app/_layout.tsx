import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '../lib/database';
import { colors } from '../lib/theme';

initDatabase();

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.dark },
          headerTintColor: colors.surface,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="planning" options={{ headerShown: false }} />
        <Stack.Screen name="maison" options={{ headerShown: false }} />
        <Stack.Screen name="sport" options={{ headerShown: false }} />
        <Stack.Screen name="recipe/[id]" options={{ title: 'Recette' }} />
      </Stack>
    </>
  );
}
