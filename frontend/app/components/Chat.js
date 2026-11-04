"use client";
import { useEffect, useRef, useState } from "react";

const MODE_LABELS = {
  documents: "D'après tes documents",
  general: "Connaissances générales, non vérifiées par tes documents",
};

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [general, setGeneral] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;

    const history = messages
      .filter((m) => !m.error)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.text }));

    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history, general_knowledge: general }),
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
            checked={general}
            onChange={(e) => setGeneral(e.target.checked)}
          />{" "}
          Autoriser les réponses hors de mes documents
        </label>
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