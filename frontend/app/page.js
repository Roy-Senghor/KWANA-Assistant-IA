import Chat from "./components/Chat";
import Documents from "./components/Documents";

export default function Home() {
  return (
    <main className="layout">
      <aside>
        <h1>Kwana</h1>
        <Documents />
      </aside>
      <section>
        <Chat />
      </section>
    </main>
  );
}