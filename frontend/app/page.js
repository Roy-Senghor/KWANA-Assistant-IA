"use client";

import { useRef, useState } from "react";
import Chat from "./components/Chat";
import Documents from "./components/Documents";
import SettingsPanel from "./components/SettingsPanel";

export default function Home() {
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const resizeRef = useRef(null);

  function startResize(event) {
    if (sidebarCollapsed || event.target.closest("button")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = { pointerX: event.clientX, width: sidebarWidth };
  }

  function resizeSidebar(event) {
    if (!resizeRef.current) return;
    setSidebarWidth(
      Math.min(520, Math.max(220, resizeRef.current.width + event.clientX - resizeRef.current.pointerX)),
    );
  }

  return (
    <main
      className={`layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      style={{ "--sidebar-width": `${sidebarWidth}px` }}
    >
      {!sidebarCollapsed && (
        <aside>
          <div className="sidebar-heading">
            <h1>Kwana</h1>
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(true)}
              aria-label="Replier la barre latérale"
              title="Replier la barre latérale"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m12 4-6 6 6 6" />
              </svg>
            </button>
          </div>
          <div className="sidebar-content">
            <Documents />
          </div>
          <div className="sidebar-footer">
            <SettingsPanel />
          </div>
        </aside>
      )}
      <div
        className="sidebar-resizer"
        role={sidebarCollapsed ? undefined : "separator"}
        aria-orientation="vertical"
        aria-label="Largeur de la barre latérale"
        aria-valuemin={220}
        aria-valuemax={520}
        aria-valuenow={Math.round(sidebarWidth)}
        tabIndex={sidebarCollapsed ? -1 : 0}
        onPointerDown={startResize}
        onPointerMove={resizeSidebar}
        onPointerUp={() => {
          resizeRef.current = null;
        }}
        onPointerCancel={() => {
          resizeRef.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            setSidebarWidth((width) =>
              Math.min(520, Math.max(220, width + (event.key === "ArrowRight" ? 16 : -16))),
            );
          } else if (event.key === "Home") {
            setSidebarWidth(220);
          } else if (event.key === "End") {
            setSidebarWidth(520);
          }
        }}
      >
        {sidebarCollapsed && (
          <div className="collapsed-rail">
            <div className="collapsed-rail-top">
              <div className="sidebar-rail-brand" aria-label="Kwana" title="Kwana">
                K
              </div>
              <button
                className="sidebar-toggle expand-sidebar"
                onClick={() => setSidebarCollapsed(false)}
                aria-label="Déployer la barre latérale"
                title="Déployer la barre latérale"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="m8 4 6 6-6 6" />
                </svg>
              </button>
            </div>
            <div className="sidebar-footer">
              <SettingsPanel />
            </div>
          </div>
        )}
      </div>
      <section>
        <Chat />
      </section>
    </main>
  );
}
