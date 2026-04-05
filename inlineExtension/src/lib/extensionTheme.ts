/**
 * Panel UI tokens — aligned with web app globals (warm cream + #1C1E26).
 */
export const FONT =
  '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif' as const

export const PANEL = {
  bg: '#ffffff',
  headerBg: '#FAF5EE',
  surfaceMuted: '#FDFBF7',
  border: '#d6d3d1',
  shadow: '0 4px 20px rgba(0,0,0,0.10)',
  text: '#1C1E26',
  textMuted: '#78716c',
  textLight: '#a8a29e',
  accent: '#1C1E26',
  accentHover: '#13151B',
  link: '#4B83C4',
  hoverBg: '#F0EBE3',
  toneSelectedBg: '#F0EBE3',
  radius: 12,
  toggleOn: '#1C1E26',
  toggleOff: '#d6d3d1',
} as const

export type PanelTheme = typeof PANEL
