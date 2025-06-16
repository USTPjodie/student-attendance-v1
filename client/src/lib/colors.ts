const colors = {
  primary: {
    DEFAULT: "#0066FF",
    light: "#3385FF",
    dark: "#0052CC",
  },
  dark: {
    DEFAULT: "#101010",
    light: "#2A2A2A",
    lighter: "#404040",
  },
  accent: {
    DEFAULT: "#00D1D1",
    light: "#33DADA",
    dark: "#00A8A8",
  },
  background: {
    DEFAULT: "#F0F4F8",
    dark: "#E5E9ED",
    light: "#FFFFFF",
  },
  alert: {
    DEFAULT: "#FF4D6B",
    light: "#FF6B85",
    dark: "#CC3D55",
  },
  text: {
    primary: "#101010",
    secondary: "#404040",
    light: "#F0F4F8",
  },
  status: {
    success: "#00C853",
    warning: "#FFB300",
    error: "#FF4D6B",
    info: "#0066FF",
  },
  border: {
    DEFAULT: "#E5E9ED",
    dark: "#D1D5DB",
    light: "#F0F4F8",
  },
} as const;

type ColorKeys = keyof typeof colors;
type ColorVariant<T extends ColorKeys> = keyof typeof colors[T];

export function getColor<T extends ColorKeys>(
  color: T,
  variant: ColorVariant<T>
): string {
  const colorObj = colors[color];
  if (!colorObj) return "";
  
  const value = colorObj[variant];
  if (typeof value === 'string') return value;
  
  // If the requested variant doesn't exist, try to find a fallback
  if ('DEFAULT' in colorObj && typeof colorObj.DEFAULT === 'string') return colorObj.DEFAULT;
  if ('primary' in colorObj && typeof colorObj.primary === 'string') return colorObj.primary;
  if ('light' in colorObj && typeof colorObj.light === 'string') return colorObj.light;
  
  return "";
}

export { colors }; 