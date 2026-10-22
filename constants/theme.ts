/**
 * Theme & Color Palette inspired by Taxfix & Linear.
 * Clean, high-contrast fintech design optimized for mobile and desktop web.
 */

export const THEME = {
  colors: {
    // Primary Taxfix Green & Accents
    primary: '#00D084',
    primaryHover: '#05B874',
    primarySubtle: 'rgba(0, 208, 132, 0.12)',
    primaryBorder: 'rgba(0, 208, 132, 0.35)',

    // Surface & Backgrounds
    background: '#0B0F17',
    backgroundAlt: '#101622',
    card: '#151D2A',
    cardHover: '#1B2536',
    cardBorder: '#233044',
    cardBorderLight: '#2C3E56',

    // Text & Foreground
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverse: '#0B0F17',

    // Status & Badges
    accentBlue: '#38BDF8',
    accentBlueSubtle: 'rgba(56, 189, 248, 0.12)',
    accentPurple: '#A78BFA',
    accentPurpleSubtle: 'rgba(167, 139, 250, 0.12)',
    accentAmber: '#FBBF24',
    accentAmberSubtle: 'rgba(251, 191, 36, 0.12)',
    accentRed: '#F87171',
    accentRedSubtle: 'rgba(248, 113, 113, 0.12)',

    // Chat specific
    userBubble: '#1E293B',
    userBubbleBorder: '#334155',
    assistantBubble: '#131B29',
    assistantBubbleBorder: '#223048',

    // Code & JSON
    codeBg: '#090D14',
    codeBorder: '#1E293B',
    codeText: '#38BDF8',
  },

  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier, Menlo, Monaco, monospace',
  },

  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    glow: {
      shadowColor: '#00D084',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};
