// theme/ui.js
export const colors = {
  brandPrimary: '#6B0AA3',
  brandSecondary: '#4B006E',
  text: '#2d2d2d',
  subtext: '#666',
  line: '#A259C6',
  muted: '#777',
  danger: '#B00020',
  bgOverlay: 'rgba(255,255,255,0.95)',
  card: '#fff',
  shadow: '#000',
};

export const radius = {
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '800', color: colors.text },
  h2: { fontSize: 24, fontWeight: '700', color: colors.text },
  label: { fontSize: 13, color: colors.subtext },
  p: { fontSize: 16, color: colors.text },
  hint: { fontSize: 13, color: '#777' },
  link: { fontSize: 15, color: colors.brandPrimary, fontWeight: '700' },
};

export const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  button: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
};
