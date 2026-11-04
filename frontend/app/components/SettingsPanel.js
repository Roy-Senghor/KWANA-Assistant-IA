"use client";
import { useEffect, useState } from "react";
import { useSettings } from "./SettingsProvider";

const STYLES = [
  { value: "concise", label: "Concise" },
  { value: "balanced", label: "Équilibrée" },
  { value: "detailed", label: "Détaillée" },
];

const PROVIDERS = {
  openai_compat: "API compatible OpenAI",
  anthropic: "Anthropic (Claude)",
  ollama: "Ollama (local)",
};

export default function SettingsPanel() {
  const { settings, update, reset } = useSettings();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/info")
      .then((r) => (r.ok ? r.json() : null))
      .then(setInfo)
      .catch(() => setInfo(null));

    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const minScore = settings.minScore ?? info?.min_score ?? 0.3;

  return (
    <>
      <button
        className="icon-btn"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir les paramètres"
        title="Paramètres"
      >
        ⚙
      </button>

      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id="settings-title" className="modal-title">Paramètres</h2>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="field">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={settings.general}
                  onChange={(e) => update({ general: e.target.checked })}
                />
                Autoriser les réponses hors de mes documents
              </label>
              <p className="help">
                Désactivé, Kwana refuse de répondre quand rien ne correspond à tes documents.
              </p>
            </div>

            <div className="field">
              <label htmlFor="style">Style des réponses</label>
              <select
                id="style"
                value={settings.style}
                onChange={(e) => update({ style: e.target.value })}
              >
                {STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="topk">
                <span>Passages consultés</span>
                <span>{settings.topK}</span>
              </label>
              <input
                id="topk"
                type="range"
                min="1"
                max="10"
                step="1"
                value={settings.topK}
                onChange={(e) => update({ topK: Number(e.target.value) })}
              />
              <p className="help">
                Plus il y en a, plus la réponse peut être riche, mais plus elle consomme de tokens.
              </p>
            </div>

            <div className="field">
              <label htmlFor="score">
                <span>Seuil de pertinence</span>
                <span>
                  {minScore.toFixed(2)}
                  {settings.minScore === null ? " (défaut)" : ""}
                </span>
              </label>
              <input
                id="score"
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={minScore}
                onChange={(e) => update({ minScore: Number(e.target.value) })}
              />
              <p className="help">
                Plus bas : Kwana utilise plus facilement tes documents, parfois hors sujet. Plus
                haut : il se rabat plus souvent sur ses connaissances générales.
              </p>
              {settings.minScore !== null && (
                <button className="link" onClick={() => update({ minScore: null })}>
                  Revenir à la valeur du serveur
                </button>
              )}
            </div>

            <div className="field">
              <label htmlFor="history">
                <span>Mémoire de conversation</span>
                <span>{settings.historySize} messages</span>
              </label>
              <input
                id="history"
                type="range"
                min="0"
                max="6"
                step="1"
                value={settings.historySize}
                onChange={(e) => update({ historySize: Number(e.target.value) })}
              />
              <p className="help">
                À 0, chaque question est traitée seule : les questions de suivi ne seront plus
                comprises.
              </p>
            </div>

            <div className="field">
              <label htmlFor="theme">Thème</label>
              <select
                id="theme"
                value={settings.theme}
                onChange={(e) => update({ theme: e.target.value })}
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
              </select>
            </div>

            {info && (
              <div className="info">
                <div>Fournisseur : {PROVIDERS[info.provider] ?? info.provider}</div>
                <div>Modèle : {info.model || "inconnu"}</div>
                <div>Défini côté serveur (fichier .env), non modifiable ici.</div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn" onClick={reset}>Réinitialiser</button>
              <button className="btn primary" onClick={() => setOpen(false)}>Terminé</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}