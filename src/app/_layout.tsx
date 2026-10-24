import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { initializeThemeMode, useThemeMode } from "../lib/theme";

export default function RootLayout() {
  useThemeMode();
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    void initializeThemeMode().catch(() => undefined).finally(() => setThemeReady(true));
  }, []);

  if (!themeReady) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
