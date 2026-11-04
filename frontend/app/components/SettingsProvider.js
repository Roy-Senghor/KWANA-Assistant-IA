"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export const DEFAULTS = {
  general: true,
  style: "balanced",
  topK: 4,
  minScore: null, // null = valeur par défaut du serveur
  historySize: 6,
  theme: "light",
};

const STORAGE_KEY = "kwana-settings";
const SettingsContext = createContext(null);

// Le contenu du localStorage peut être périmé ou modifié à la main : on le valide.
function sanitize(saved) {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) saved = {};
  const num = (v, min, max, fallback) =>
    Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
  return {
    general: typeof saved.general === "boolean" ? saved.general : DEFAULTS.general,
    style: ["concise", "balanced", "detailed"].includes(saved.style)
      ? saved.style
      : DEFAULTS.style,
    topK: num(saved.topK, 1, 10, DEFAULTS.topK),
    minScore: saved.minScore == null ? null : num(saved.minScore, 0, 1, null),
    historySize: num(saved.historySize, 0, 6, DEFAULTS.historySize),
    theme: saved.theme === "dark" ? "dark" : "light",
  };
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  // Lecture au démarrage (dans un effet : le localStorage n'existe pas côté serveur).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      setSettings(sanitize(saved));
    } catch {
      // stockage indisponible ou contenu corrompu : valeurs par défaut
    }
    setLoaded(true);
  }, []);

  // Sauvegarde et application du thème à chaque changement.
  useEffect(() => {
    if (!loaded) return;
    document.documentElement.dataset.theme = settings.theme;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // navigation privée ou stockage plein : on ignore
    }
  }, [settings, loaded]);

  const update = useCallback((changes) => setSettings((s) => ({ ...s, ...changes })), []);
  const reset = useCallback(() => setSettings(DEFAULTS), []);

  return (
    <SettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings doit être utilisé dans un <SettingsProvider>");
  return ctx;
}