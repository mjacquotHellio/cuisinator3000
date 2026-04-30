// ============================================================
// theme.ts — Design System Maisontator 3000
// ============================================================

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

// ─── Couleurs ────────────────────────────────────────────────
export const colors = {
  primary: '#FF6B35',       // Orange tangerine — CTA, boutons
  dark: '#1D1D1B',          // Anthracite — header, titres
  background: '#F8F7F5',    // Blanc cassé — fond général
  surface: '#FFFFFF',       // Blanc pur — cartes
  success: '#4CAF50',       // Vert — badges, étapes
  textPrimary: '#1D1D1B',
  textSecondary: '#888888',
  border: '#E8E8E6',
  primaryLight: '#FFF0EA',  // Orange très clair — fond emoji
  successLight: '#E8F5E9',  // Vert très clair — fond emoji alternatif
  house: '#5B8DB8',         // Bleu ardoise — univers Maison
  houseLight: '#EBF2F8',    // Bleu très clair — fond icônes Maison
} as const;

// ─── Typographie ─────────────────────────────────────────────
export const typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  lineHeights: {
    tight: 18,
    normal: 22,
    relaxed: 26,
  },
} as const;

// ─── Espacements (échelle 4px) ────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

// ─── Ombres ───────────────────────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  primary: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

// ─── Composant : Badge ────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = colors.success,
  style,
}) => (
  <View
    style={[
      badgeStyles.container,
      { backgroundColor: color + '22' }, // 13% opacity
      style,
    ]}
  >
    <Text style={[badgeStyles.text, { color }]}>{label}</Text>
  </View>
);

const badgeStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  text: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
    letterSpacing: 0.2,
  },
});

