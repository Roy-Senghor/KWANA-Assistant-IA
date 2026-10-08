"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [health, setHealth] = useState("chargement...");

  useEffect(() => {
    fetch("/api/health/db")
      .then((r) => r.json())
      .then((d) => setHealth(JSON.stringify(d)))
      .catch(() => setHealth("API injoignable"));
  }, []);

  return (
    <main>
      <h1>Kwana</h1>
      <p>État de l'API : {health}</p>
    </main>
  );
}