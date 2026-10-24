import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { StyleSheet } from "react-native";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "stayfit-gym-theme";
let activeTheme: ThemeMode = "dark";
const listeners = new Set<() => void>();

export const ThemePalette = {
  dark: {
    background: "#06111C", panel: "#102131", panelDeep: "#0B1A28", border: "#1C3040",
    borderBright: "#1D3A55", text: "#FFFFFF", muted: "#98A2B3", dim: "#667085",
    blue: "#4D8DFF", blueStrong: "#1769FF", cyan: "#169BFF", green: "#54D98C",
    red: "#FF8585", yellow: "#F4C95D",
  },
  light: {
    background: "#F4F7FB", panel: "#FFFFFF", panelDeep: "#EEF2F7", border: "#D9E1EA",
    borderBright: "#BFCBDA", text: "#142536", muted: "#5D6B7B", dim: "#768396",
    blue: "#1769FF", blueStrong: "#1769FF", cyan: "#1685D1", green: "#168A4A",
    red: "#B42318", yellow: "#936500",
  },
} as const;

export function getThemeMode(): ThemeMode {
  return activeTheme;
}

export function getThemePalette(mode = activeTheme) {
  return ThemePalette[mode];
}

function emitThemeChange() {
  listeners.forEach((listener) => listener());
}

export function useThemeMode() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    getThemeMode,
    (): ThemeMode => "dark",
  );
}

export async function initializeThemeMode() {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") activeTheme = saved;
  emitThemeChange();
}

export async function setThemeMode(mode: ThemeMode) {
  await AsyncStorage.setItem(STORAGE_KEY, mode);
  activeTheme = mode;
  emitThemeChange();
}

function lightStyle(style: Record<string, unknown>, styleName: string) {
  const output: Record<string, unknown> = {};
  for (const [property, original] of Object.entries(style)) {
    if (typeof original !== "string" || !original.startsWith("#")) {
      output[property] = original;
      continue;
    }

    const value = original.toUpperCase();
    if (property === "backgroundColor") {
      const backgrounds: Record<string, string> = {
        "#06111C": ThemePalette.light.background,
        "#0B1A28": ThemePalette.light.panelDeep,
        "#102131": ThemePalette.light.panel,
        "#142C4A": "#E8F0FC",
        "#122F4B": "#E8F0FC",
        "#122D50": "#E8F0FC",
        "#102742": "#E8F0FC",
        "#123D2A": "#E7F6EC",
        "#351B25": "#FDECEC",
        "#40351D": "#FFF3D1",
        "#332C1F": "#FFF4D9",
        "#3A2025": "#FDECEC",
        "#3A2D17": "#FFF3D1",
        "#1B6340": "#E7F6EC",
        "#173B70": "#E8F0FC",
        "#151A20": "#EEF2F7",
        "#101828": "#EEF2F7",
        "#F5F9FC": "#FFFFFF",
        "#F2F6FC": "#FFFFFF",
      };
      output[property] = backgrounds[value] ?? original;
    } else if (property === "borderColor" || property === "borderTopColor" || property === "borderBottomColor") {
      const borders: Record<string, string> = {
        "#1C3040": ThemePalette.light.border,
        "#1D3A55": ThemePalette.light.borderBright,
        "#24394A": ThemePalette.light.border,
        "#713344": "#E6BFC4",
        "#442531": "#E6BFC4",
      };
      output[property] = borders[value] ?? original;
    } else if (property === "color" || property === "tintColor") {
      if (value === "#FFFFFF") {
        output[property] = /(button|purchase|submit|price|selectedText|avatarText)/i.test(styleName) ? "#FFFFFF" : ThemePalette.light.text;
      } else {
        const colors: Record<string, string> = {
          "#98A2B3": ThemePalette.light.muted,
          "#667085": ThemePalette.light.dim,
          "#D0D5DD": "#344454",
          "#4D8DFF": ThemePalette.light.blue,
          "#54D98C": ThemePalette.light.green,
          "#1ED760": ThemePalette.light.green,
          "#FF8585": ThemePalette.light.red,
          "#FF5C5C": ThemePalette.light.red,
          "#F4C95D": ThemePalette.light.yellow,
          "#F0B45A": ThemePalette.light.yellow,
          "#64748B": ThemePalette.light.muted,
          "#475467": ThemePalette.light.muted,
          "#AFC0D0": "#526273",
          "#E4E7EC": "#475467",
          "#155EEF": ThemePalette.light.blue,
          "#0274DF": ThemePalette.light.blue,
          "#208AEF": ThemePalette.light.blue,
          "#3C9FFE": ThemePalette.light.blue,
          "#3C87F7": ThemePalette.light.blue,
          "#79AFFF": ThemePalette.light.blue,
          "#B2CCFF": "#315A91",
        };
        output[property] = colors[value] ?? original;
      }
    } else {
      output[property] = original;
    }
  }
  return output;
}

export function createThemeStyles<T extends StyleSheet.NamedStyles<T>>(source: T): T {
  const lightSource = Object.fromEntries(
    Object.entries(source).map(([name, style]) => [name, lightStyle(style as Record<string, unknown>, name)]),
  ) as unknown as T;
  const cache = {
    dark: StyleSheet.create(source),
    light: StyleSheet.create(lightSource),
  };
  return new Proxy({} as T, {
    get(_target, property: string | symbol) {
      return cache[activeTheme][property as keyof T];
    },
  });
}
