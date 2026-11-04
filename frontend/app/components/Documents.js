"use client";
import { useCallback, useEffect, useState } from "react";

const LABELS = {
  pending: "En attente",
  processing: "Traitement…",
  done: "Prêt",
  failed: "Échec",
};

const ALLOWED = [".pdf", ".txt", ".md"];
const MAX_SIZE = 20 * 1024 * 1024; // 20 Mo, comme côté API

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState("");
  const [uploadErrors, setUploadErrors] = useState([]);
  const [uploading, setUploading] = useState(null); // { current, total } ou null
  const [dragging, setDragging] = useState(false);

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

  // Un fichier lâché à côté de la zone ne doit pas être ouvert par le navigateur.
  useEffect(() => {
    const stop = (e) => e.preventDefault();
    window.addEventListener("dragover", stop);
    window.addEventListener("drop", stop);
    return () => {
      window.removeEventListener("dragover", stop);
      window.removeEventListener("drop", stop);
    };
  }, []);

  async function uploadFiles(files) {
    if (files.length === 0 || uploading) return;

    setUploadErrors([]);
    const problems = [];

    // Envois l'un après l'autre : le serveur et le worker ne sont pas surchargés.
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploading({ current: i + 1, total: files.length });

      const ext = "." + file.name.split(".").pop().toLowerCase();
      if (!ALLOWED.includes(ext)) {
        problems.push(`${file.name} : type non autorisé (PDF, TXT ou MD)`);
        continue;
      }
      if (file.size === 0) {
        problems.push(`${file.name} : fichier vide`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        problems.push(`${file.name} : trop volumineux (20 Mo max)`);
        continue;
      }

      const form = new FormData();
      form.append("file", file);

      try {
        const res = await fetch("/api/documents", { method: "POST", body: form });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          problems.push(`${file.name} : ${data.detail || "échec de l'envoi"}`);
        }
      } catch {
        problems.push(`${file.name} : serveur injoignable`);
      }
    }

    setUploading(null);
    setUploadErrors(problems);
    await load();
  }

  function onDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave(e) {
    // le curseur passe sur un élément enfant : on est toujours dans la zone
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragging(false);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  }

  function onPick(e) {
    const files = Array.from(e.target.files);
    e.target.value = ""; // permet de rechoisir le même fichier ensuite
    uploadFiles(files);
  }

  async function remove(id) {
    if (!confirm("Supprimer ce document ?")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("Suppression impossible.");
  }

  let dropText = "Glisse tes fichiers ici ou clique pour choisir";
  if (uploading) dropText = `Envoi ${uploading.current}/${uploading.total}…`;
  else if (dragging) dropText = "Relâche pour envoyer";

  return (
    <div>
      <label
        className={`upload ${dragging ? "dragging" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {dropText}
        <small>PDF, TXT, MD · 20 Mo max</small>
        <input
          type="file"
          accept=".pdf,.txt,.md"
          multiple
          onChange={onPick}
          disabled={!!uploading}
        />
      </label>

      {uploadErrors.length > 0 && (
        <ul className="errors">
          {uploadErrors.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      )}
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