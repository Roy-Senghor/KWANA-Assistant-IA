"use client";
import { useCallback, useEffect, useState } from "react";

const LABELS = {
  pending: "En attente",
  processing: "Traitement…",
  done: "Prêt",
  failed: "Échec",
};

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error();
      setDocs(await res.json());
      setError("");
    } catch {
      setError("Impossible de charger les documents.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Tant qu'un document est en cours de traitement, on rafraîchit la liste.
  useEffect(() => {
    const busy = docs.some((d) => d.status === "pending" || d.status === "processing");
    if (!busy) return;
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [docs, load]);

  async function upload(event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;

    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/documents", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Échec de l'envoi.");
      }
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  async function remove(id) {
    if (!confirm("Supprimer ce document ?")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("Suppression impossible.");
  }

  return (
    <div>
      <label className="upload">
        {uploading ? "Envoi en cours…" : "+ Ajouter un document (PDF, TXT, MD)"}
        <input type="file" accept=".pdf,.txt,.md" onChange={upload} disabled={uploading} />
      </label>
      {error && <p className="error">{error}</p>}

      <h2>Documents</h2>
      {docs.length === 0 && <p className="empty">Aucun document pour l'instant.</p>}
      {docs.map((d) => (
        <div className="doc" key={d.id}>
          <span className="doc-name" title={d.filename}>{d.filename}</span>
          <span className={`badge ${d.status}`}>{LABELS[d.status] ?? d.status}</span>
          <button onClick={() => remove(d.id)} title="Supprimer">✕</button>
        </div>
      ))}
    </div>
  );
}