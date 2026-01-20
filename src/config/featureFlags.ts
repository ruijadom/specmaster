// Feature flags configuration
// Set LAUNCH_MODE to true when ready to launch the full app
// When false, only the waitlist page is shown

export const FEATURE_FLAGS = {
  // When false: shows only waitlist at /
  // When true: shows full app with all routes
  LAUNCH_MODE: false,
} as const;
