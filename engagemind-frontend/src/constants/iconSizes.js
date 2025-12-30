// Standard icon sizes
export const ICON_SIZES = {
  xs: 16,   // Extra small (rarely used)
  sm: 20,   // Small buttons, inline text
  md: 24,   // Medium (default for most UI)
  lg: 28,   // Large headers, emphasis
  xl: 32,   // Extra large (rarely used)
};

// Icon color tokens for different contexts
export const ICON_COLORS = {
  // Primary actions
  primary: 'text-teal-700',
  primaryHover: 'hover:text-teal-800',
  primaryOnBg: 'text-white',

  // Secondary actions
  secondary: 'text-gray-700',
  secondaryHover: 'hover:text-gray-800',

  // Danger actions
  danger: 'text-red-600',
  dangerHover: 'hover:text-red-700',

  // Muted/disabled
  muted: 'text-gray-500',
  disabled: 'text-gray-400',
};

// Focus ring utilities
export const FOCUS_RING = 'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2';
