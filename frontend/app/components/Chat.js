"use client";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "./SettingsProvider";

const MODE_LABELS = {
  documents: "D'après tes documents",
  general: "Connaissances générales, non vérifiées par tes documents",
};

export default function Chat() {
  const { settings, update } = useSettings();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;

    const history =
      settings.historySize === 0
        ? []
        : messages
            .filter((m) => !m.error)
            .slice(-settings.historySize)
            .map((m) => ({ role: m.role, content: m.text }));

    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history,
          general_knowledge: settings.general,
          top_k: settings.topK,
          min_score: settings.minScore,
          style: settings.style,
        }),
      });
      if (!res.ok) throw new Error("Le service n'a pas pu répondre. Réessaie dans un instant.");
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.answer, sources: data.sources, mode: data.mode },
      ]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: e.message, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="messages">
        {messages.length === 0 && (
          <p className="hint">Pose une question sur tes documents, ou sur autre chose.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role} ${m.error ? "error" : ""}`}>
            {m.text}
            {m.sources?.length > 0 && (
              <div className="sources">
                {m.sources.map((s) => (
                  <div key={s.ref}>
                    [{s.ref}] {s.filename} · score {s.score}
                  </div>
                ))}
              </div>
            )}
            {MODE_LABELS[m.mode] && <div className="mode">{MODE_LABELS[m.mode]}</div>}
          </div>
        ))}
        {loading && <div className="msg assistant">Kwana réfléchit…</div>}
        <div ref={bottomRef} />
      </div>

      <div className="options">
        <label>
          <input
            type="checkbox"
            checked={settings.general}
            onChange={(e) => update({ general: e.target.checked })}
          />{" "}
          Autoriser les réponses hors de mes documents
        </label>
        <button className="link" onClick={() => setMessages([])} disabled={messages.length === 0}>
          Nouvelle conversation
        </button>
      </div>

      <div className="composer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ta question…"
          disabled={loading}
        />
        <button onClick={send} disabled={loading || !input.trim()}>
          Envoyer
        </button>
      </div>
    </>
  );
}