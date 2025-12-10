// Common CSS classes and styles used across meal components
export const COMMON_STYLES = {
  INPUT_CLASS: "w-full p-3 rounded-lg border border-amber-700 bg-amber-800 text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500",
  DISABLED_INPUT_CLASS: "w-full p-3 rounded-lg border border-amber-700 bg-amber-900/50 text-amber-300 cursor-not-allowed",
  MODAL_BACKDROP: "fixed inset-0 bg-black/70 backdrop-blur-sm",
  MODAL_CONTAINER: "fixed inset-0 z-[95] flex items-center justify-center p-4",
  CARD_BASE: "bg-amber-900/40 border-amber-700/30 rounded-xl shadow-lg",
  BUTTON_PRIMARY: "bg-amber-600 hover:bg-amber-700 text-white",
  BUTTON_SECONDARY: "bg-amber-800/50 hover:bg-amber-700/60 border border-amber-700/50 text-amber-100",
  TEXT_AMBER_PRIMARY: "text-amber-100",
  TEXT_AMBER_SECONDARY: "text-amber-200",
  TEXT_AMBER_MUTED: "text-amber-300",
} as const;

// Common Z-index values for layered components
export const Z_INDEX = {
  MODAL_BACKDROP: 90,
  MODAL_CONTAINER: 95,
  MODAL_CONTENT: 96,
} as const;

// Default values for various form inputs
export const DEFAULTS = {
  QUANTITY: 1,
  KCAL_PER_UNIT: 1,
  MAX_FOODS_TO_SHOW: 3,
  SEARCH_DEBOUNCE_MS: 250,
  MAX_SEARCH_RESULTS: 12,
} as const;