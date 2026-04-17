/**
 * Panel UI tokens — aligned with the Inline web app: calm, minimal elevation,
 * moderate rounding (14px outer / 10px inner), font-medium weight, ring borders.
 */
export const FONT =
  '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif' as const

export const PANEL = {
  bg: '#FFFFFF',
  headerBg: '#FAFAFA',
  surfaceMuted: '#F5F5F5',
  surfaceBubble: '#FAFAFA',
  border: 'rgba(0, 0, 0, 0.08)',
  divider: 'rgba(0, 0, 0, 0.06)',
  shadow: '0 8px 32px -8px rgba(0, 0, 0, 0.12)',
  shadowSoft: 'none',
  text: '#1C1E26',
  textMuted: '#666666',
  textLight: '#999999',
  accent: '#1C1E26',
  accentHover: '#13151B',
  link: '#4B83C4',
  hoverBg: 'rgba(0, 0, 0, 0.04)',
  toneSelectedBg: '#F0F0F0',
  radius: 16,
  radiusMd: 12,
  radiusSm: 8,
  radiusPill: 9999,
  toggleOn: '#2c2f3a',
  toggleOff: '#D4D4D4',
  inputBg: '#FAFAFA',
} as const

export const DARK_PANEL = {
  bg: '#1C1E26',
  headerBg: '#252830',
  surfaceMuted: '#2a2d38',
  surfaceBubble: '#22252e',
  border: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.06)',
  shadow: '0 12px 40px -12px rgba(0, 0, 0, 0.28)',
  shadowSoft: 'none',
  text: '#E4E4E8',
  textMuted: '#9a9ba4',
  textLight: '#6b6d78',
  accent: '#E4E4E8',
  accentHover: '#FFFFFF',
  link: '#7DB4F0',
  hoverBg: 'rgba(255, 255, 255, 0.06)',
  toneSelectedBg: '#31343e',
  radius: 14,
  radiusMd: 10,
  radiusSm: 8,
  radiusPill: 9999,
  toggleOn: '#7DB4F0',
  toggleOff: '#3a3d48',
  inputBg: '#22252e',
} as const

export type PanelTheme = typeof PANEL
