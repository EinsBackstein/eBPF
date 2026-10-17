import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  ExternalLink,
  FileText,
  GitBranch,
  Maximize2,
  Monitor,
  Play,
  Pause,
  RotateCcw,
  Radio,
  ShieldCheck,
  Terminal,
  X,
  Zap,
  Eye,
  Network,
  Keyboard,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
} from "lucide-react";
import { slides, sources, questions } from "./deck";
import { initialLab, sendPackets, readSnapshot } from "./model.mjs";
import "@fontsource-variable/dm-sans/wght.css";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "./styles.css";

type Lab = typeof initialLab;
type Snapshot = { index: number; black: boolean; lab: Lab; answers: number[] };
const KEY = "ebpf-deck-v1";
const view = new URLSearchParams(location.search).get("view");
const audience = view === "audience";
const presenter = view === "presenter";
function stored(): Snapshot {
  try {
    return (
      (readSnapshot(
        JSON.parse(localStorage.getItem(KEY) || "null"),
        slides.length,
      ) as Snapshot) || {
        index: 0,
        black: false,
        lab: { ...initialLab },
        answers: [],
      }
    );
  } catch {
    return { index: 0, black: false, lab: { ...initialLab }, answers: [] };
  }
}
function App() {
  const [state, setState] = useState<Snapshot>(stored);
  const [modal, setModal] = useState<"help" | "overview" | null>(null);
  const [notes, setNotes] = useState(presenter);
  const [sidebar, setSidebar] = useState(true);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [connected, setConnected] = useState(false);
  const [notice, setNotice] = useState("");
  const [customNotes, setCustomNotes] = useState<Record<number, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("ebpf-notes") || "{}");
    } catch {
      return {};
    }
  });
  const channel = useRef<BroadcastChannel | null>(null);
  const current = useRef(state);
  current.current = state;
  const lastAudience = useRef(0);
  const timerOrigin = useRef(0);
  const timerElapsed = useRef(0);
  const slide = slides[state.index];
  const mode = state.index === 11 ? "xdp" : "network";
  useEffect(() => {
    document.getElementById("content")?.scrollTo({ top: 0 });
    if (innerWidth <= 700) window.scrollTo({ top: 0 });
  }, [state.index]);
  useEffect(() => {
    let bus: BroadcastChannel | null = null;
    try {
      bus = new BroadcastChannel(KEY);
      channel.current = bus;
    } catch {
      /* localStorage fallback */
    }
    const receive = (message: Record<string, unknown>) => {
      if (message.type === "hello" && !audience) {
        lastAudience.current = Date.now();
        setConnected(true);
        bus?.postMessage({ type: "state", value: current.current });
      }
      if (message.type === "state" && audience) {
        const next = readSnapshot(message.value, slides.length);
        if (next) setState(next as Snapshot);
      }
    };
    if (bus) bus.onmessage = (e) => receive(e.data || {});
    const onStorage = (event: StorageEvent) => {
      if (audience && event.key === KEY) {
        try {
          const next = readSnapshot(
            JSON.parse(event.newValue || "null"),
            slides.length,
          );
          if (next) setState(next as Snapshot);
        } catch {
          /* ignore corrupt state */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    if (audience) bus?.postMessage({ type: "hello" });
    const heartbeat = window.setInterval(() => {
      if (audience) bus?.postMessage({ type: "hello" });
      else setConnected(Date.now() - lastAudience.current < 6500);
    }, 2000);
    return () => {
      clearInterval(heartbeat);
      bus?.close();
      channel.current = null;
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  useEffect(() => {
    if (!audience) {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {
        /* channel still works */
      }
      channel.current?.postMessage({ type: "state", value: state });
    }
  }, [state]);
  useEffect(() => {
    if (!running) return;
    timerOrigin.current = Date.now();
    const id = setInterval(
      () =>
        setSeconds(
          timerElapsed.current +
            Math.floor((Date.now() - timerOrigin.current) / 1000),
        ),
      250,
    );
    return () => {
      timerElapsed.current += Math.floor(
        (Date.now() - timerOrigin.current) / 1000,
      );
      clearInterval(id);
    };
  }, [running]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(id);
  }, [notice]);
  const go = (index: number) => {
    if (audience) return;
    const target = Math.max(0, Math.min(slides.length - 1, index));
    setState((s) => ({
      ...s,
      index: target,
      black: false,
      lab:
        (s.index === 11) !== (target === 11)
          ? { ...initialLab, events: [] }
          : s.lab,
    }));
  };
  const fullscreen = () => {
    if (document.fullscreenElement)
      document
        .exitFullscreen()
        .catch(() => setNotice("Vollbild konnte nicht beendet werden."));
    else
      document.documentElement
        .requestFullscreen?.()
        .catch(() =>
          setNotice("Bitte Vollbild über das Browser-Menü aktivieren."),
        );
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest(
          "input,textarea,select,[contenteditable]",
        ) ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      if (e.key === "Escape") {
        setModal(null);
        return;
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        fullscreen();
        return;
      }
      if (audience || modal) return;
      if (["ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        go(current.current.index + 1);
      }
      if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        go(current.current.index - 1);
      }
      if (e.key === "Home") {
        e.preventDefault();
        go(0);
      }
      if (e.key === "End") {
        e.preventDefault();
        go(slides.length - 1);
      }
      if (e.key.toLowerCase() === "b")
        setState((s) => ({ ...s, black: !s.black }));
      if (e.key.toLowerCase() === "n") setNotes((n) => !n);
      if (e.key === "?") setModal("help");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [modal]);
  const updateLab = (patch: Partial<Lab>) =>
    setState((s) => ({ ...s, lab: { ...s.lab, ...patch } }));
  const send = (count: number) =>
    setState((s) => ({ ...s, lab: sendPackets(s.lab, mode, count) }));
  const resetLab = () =>
    setState((s) => ({ ...s, lab: { ...initialLab, events: [] } }));
  function openAudience() {
    const url = new URL(location.href);
    url.search = "?view=audience";
    const win = window.open(
      url.href,
      "ebpf-audience",
      "popup,width=1440,height=900",
    );
    if (!win) {
      setNotice(
        "Popup blockiert. Bitte Popups erlauben oder die Zuschaueransicht über den Link öffnen.",
      );
      return;
    }
    setNotes(true);
    setRunning(true);
    setNotice(
      "Zuschauerfenster auf den zweiten Bildschirm ziehen. Dort mit F Vollbild aktivieren.",
    );
  }
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  function downloadHandout() {
    const text =
      `# eBPF: Netzwerkverkehr beobachten, verteilen und absichern\n\n` +
      slides
        .filter((s) => s.kind !== "intro")
        .map((s) => `## ${s.short}\n\n${s.description}\n\n${s.notes}\n`)
        .join("\n") +
      `\n## Prüfungsfragen mit Antworten\n\n` +
      questions.map(([q, a]) => `${q}\n\n${a}\n`).join("\n") +
      "\n## Quellen\n\n" +
      sources.map(([title, url]) => `- ${title}: ${url}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([text], { type: "text/markdown;charset=utf-8" }),
    );
    a.download = "eBPF-Handout.md";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const controls = {
    lab: state.lab,
    mode,
    audience,
    updateLab,
    send,
    resetLab,
  };
  if (audience)
    return (
      <div className={`audience ${state.black ? "blacked" : ""}`}>
        <div className="audience-brand">
          <Brand />
          <span>INSIDE THE KERNEL</span>
          <span>
            {String(state.index + 1).padStart(2, "0")} / {slides.length}
          </span>
        </div>
        <main>
          <SlideContent
            index={state.index}
            answers={state.answers}
            toggleAnswer={() => {}}
            {...controls}
          />
        </main>
        <div
          className="audience-progress"
          style={{ width: `${((state.index + 1) / slides.length) * 100}%` }}
        />
        <button
          className="audience-fullscreen icon-btn"
          title="Vollbild (F)"
          aria-label="Vollbild"
          onClick={fullscreen}
        >
          <Maximize2 size={18} />
        </button>
      </div>
    );
  return (
    <div className="app">
      <header className="topbar">
        <a
          className="brand-link"
          href={location.pathname}
          aria-label="eBPF Startseite"
        >
          <Brand />
          <span className="brand-divider" />
          <span className="brand-sub">Inside the kernel</span>
        </a>
        <nav className="topnav" aria-label="Hauptnavigation">
          <button
            className={slide.kind === "lab" ? "" : "active"}
            onClick={() => go(0)}
          >
            Präsentation
          </button>
          <button
            className={slide.kind === "lab" ? "active" : ""}
            onClick={() => go(11)}
          >
            Praxis-Labor <span className="tiny-dot" />
          </button>
          <a
            href="https://github.com/EinsBackstein/eBPF"
            target="_blank"
            rel="noreferrer"
          >
            Repository <ArrowUpRight size={13} />
          </a>
        </nav>
        <button
          className="icon-btn help-top"
          onClick={() => setModal("help")}
          aria-label="Hilfe und Tastenkürzel"
        >
          <CircleHelp size={19} />
        </button>
      </header>
      <div className={`workspace ${sidebar ? "" : "sidebar-hidden"}`}>
        <aside className="sidebar">
          <div className="sidebar-heading">
            <span>DEIN VORTRAG</span>
            <button
              className="icon-btn"
              onClick={() => setSidebar(false)}
              aria-label="Seitenleiste ausblenden"
            >
              <PanelLeftClose size={15} />
            </button>
          </div>
          <button
            className="overview-button"
            onClick={() => setModal("overview")}
          >
            <Network size={15} /> Folienübersicht <span>{slides.length}</span>
          </button>
          <nav aria-label="Folien">
            {["Einstieg", "Grundlagen", "Einsatz", "Praxis", "Abschluss"].map(
              (section) => (
                <div className="nav-group" key={section}>
                  <div className="group-title">
                    {section}
                    {section === "Praxis" && <span>INTERAKTIV</span>}
                  </div>
                  {slides.map(
                    (s, i) =>
                      s.section === section && (
                        <button
                          key={s.short}
                          aria-current={state.index === i ? "step" : undefined}
                          onClick={() => go(i)}
                          className={`slide-link ${state.index === i ? "selected" : ""}`}
                        >
                          <span className="slide-number">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {s.short}
                          {state.index === i && (
                            <span className="selection-dot" />
                          )}
                        </button>
                      ),
                  )}
                </div>
              ),
            )}
          </nav>
          <div className="sidebar-bottom">
            <div className="mini-terminal">
              <Terminal size={17} />
              <span>
                Vom Konzept zum Kernel.
                <small>Ein interaktives eBPF-Referat</small>
              </span>
            </div>
            <button onClick={downloadHandout}>
              <Download size={14} /> Handout herunterladen{" "}
              <ArrowUpRight size={13} />
            </button>
          </div>
        </aside>
        <div className="main-column">
          <div className="toolbar">
            <div className="breadcrumb">
              {!sidebar && (
                <button
                  className="icon-btn"
                  onClick={() => setSidebar(true)}
                  aria-label="Seitenleiste einblenden"
                >
                  <PanelLeftOpen size={16} />
                </button>
              )}
              <span>eBPF</span>
              <ChevronRight size={13} />
              <span>{slide.section}</span>
              <ChevronRight size={13} />
              <strong>{slide.short}</strong>
            </div>
            <div className="toolbar-actions">
              <span className={`connection ${connected ? "online" : ""}`}>
                <span />
                {connected ? "Zuschauer verbunden" : "Referentenmodus"}
              </span>
              <button
                className={`subtle-button ${notes ? "is-on" : ""}`}
                onClick={() => setNotes(!notes)}
              >
                <FileText size={15} />
                <span>Sprechtext</span>
              </button>
              <button className="present-button" onClick={openAudience}>
                <Monitor size={15} />
                <span>Präsentieren</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
          <main id="content" className={`content ${notes ? "with-notes" : ""}`}>
            <div className="slide-wrapper">
              <div className="slide-meta">
                <span>
                  <span className="orange-dot" /> INTERAKTIVE PRÄSENTATION
                </span>
                <span>
                  FOLIE {String(state.index + 1).padStart(2, "0")}{" "}
                  <i>/ {slides.length}</i>
                </span>
              </div>
              <div className={state.black ? "stage is-black" : "stage"}>
                <SlideContent
                  index={state.index}
                  answers={state.answers}
                  toggleAnswer={(i) =>
                    setState((s) => ({
                      ...s,
                      answers: s.answers.includes(i)
                        ? s.answers.filter((v) => v !== i)
                        : [...s.answers, i],
                    }))
                  }
                  {...controls}
                />
              </div>
              <div className="slide-bottom">
                <span>
                  <span className="green-dot" />{" "}
                  {slide.kind === "lab"
                    ? "Interaktive Simulation · keine Kernel-Ausführung"
                    : "Linux-Netzwerke verstehen"}
                </span>
                <span>THEORIE → PRAXIS</span>
              </div>
            </div>
            {notes && (
              <section className="speaker-panel">
                <div className="speaker-head">
                  <span>
                    <FileText size={16} /> Sprechtext{" "}
                    <small>NUR FÜR DICH</small>
                  </span>
                  <div className={`timer ${seconds >= 2160 ? "over" : ""}`}>
                    <span>{time}</span>
                    <button
                      className="icon-btn"
                      onClick={() => setRunning(!running)}
                      aria-label={running ? "Timer pausieren" : "Timer starten"}
                    >
                      {running ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => {
                        setRunning(false);
                        timerElapsed.current = 0;
                        setSeconds(0);
                      }}
                      aria-label="Timer zurücksetzen"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>
                <textarea
                  aria-label="Sprechtext bearbeiten"
                  value={customNotes[state.index] ?? slide.notes}
                  onChange={(e) => {
                    const next = {
                      ...customNotes,
                      [state.index]: e.target.value,
                    };
                    setCustomNotes(next);
                    try {
                      localStorage.setItem("ebpf-notes", JSON.stringify(next));
                    } catch {
                      setNotice(
                        "Sprechtext konnte nicht dauerhaft gespeichert werden.",
                      );
                    }
                  }}
                />
                <div className="speaker-next">
                  <span>ALS NÄCHSTES</span>
                  <strong>
                    {slides[state.index + 1]?.short || "Ende der Präsentation"}
                  </strong>
                  <span>Richtzeit dieser Folie: {slide.time}</span>
                </div>
              </section>
            )}
          </main>
          <footer className="deck-footer">
            <div className="footer-left">
              <span className="keycap">←</span>
              <span className="keycap">→</span>
              <span>zum Navigieren</span>
              <button onClick={() => setModal("help")}>
                <Keyboard size={15} />
              </button>
            </div>
            <div className="deck-progress">
              <div>
                <span
                  style={{
                    width: `${((state.index + 1) / slides.length) * 100}%`,
                  }}
                />
              </div>
              <span>
                {String(state.index + 1).padStart(2, "0")} / {slides.length}
              </span>
            </div>
            <div className="footer-controls">
              <button
                onClick={() => go(state.index - 1)}
                disabled={state.index === 0}
                aria-label="Vorherige Folie"
              >
                <ArrowLeft size={17} />
              </button>
              <button
                className="next-button"
                onClick={() => go(state.index + 1)}
                disabled={state.index === slides.length - 1}
              >
                Weiter <ArrowRight size={17} />
              </button>
            </div>
          </footer>
        </div>
      </div>
      {notice && (
        <div role="status" className="toast">
          <Monitor size={17} />
          {notice}
          <button
            className="icon-btn"
            aria-label="Hinweis schließen"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className={`modal ${modal === "overview" ? "wide" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "overview" ? "Folienübersicht" : "Präsentation bedienen"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="modal-close icon-btn"
              onClick={() => setModal(null)}
              aria-label="Dialog schließen"
            >
              <X />
            </button>
            {modal === "overview" ? (
              <>
                <span className="eyebrow">DER ROTE FADEN</span>
                <h2>Vom Konzept zur Praxis.</h2>
                <div className="overview-grid">
                  {slides.map((s, i) => (
                    <button
                      key={i}
                      className={state.index === i ? "chosen" : ""}
                      onClick={() => {
                        go(i);
                        setModal(null);
                      }}
                    >
                      <span>
                        {String(i + 1).padStart(2, "0")}{" "}
                        <small>{s.section}</small>
                      </span>
                      <strong>{s.short}</strong>
                      <span>
                        {s.time} {s.kind === "lab" && "· Interaktiv"}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow">BEREIT FÜR DEN VORTRAG</span>
                <h2>Deine Bühne. Zwei Ansichten.</h2>
                <p>
                  macOS: In den Bildschirmeinstellungen „Erweiterter Bildschirm“
                  verwenden. Mit „Präsentieren“ das Zuschauerfenster öffnen, auf
                  den zweiten Monitor ziehen und dort mit <kbd>F</kbd> Vollbild
                  aktivieren.
                </p>
                <p>
                  Bei einer Videokonferenz ausschließlich das Zuschauerfenster
                  oder den zweiten Bildschirm teilen. Sprechtext wird nur in der
                  Referentenansicht angezeigt.
                </p>
                <div className="shortcuts">
                  {[
                    ["← / →", "Vorherige / nächste Folie"],
                    ["Home / End", "Erste / letzte Folie"],
                    ["N", "Sprechtext ein-/ausblenden"],
                    ["B", "Zuschauerbild schwarz schalten"],
                    ["F", "Vollbild im aktuellen Fenster"],
                    ["?", "Diese Hilfe öffnen"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <kbd>{k}</kbd>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="help-links">
                  <a href="?view=audience" target="ebpf-audience">
                    Zuschaueransicht öffnen <ExternalLink size={14} />
                  </a>
                  <a href="?view=presenter" target="_blank" rel="noreferrer">
                    Referentenansicht öffnen <ExternalLink size={14} />
                  </a>
                </div>
                <p className="muted">
                  Synchronisierung im gleichen Browserprofil und auf demselben
                  Ursprung. Das Bildschirmteilen übernimmt macOS bzw. deine
                  Konferenz-App.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Zap size={22} fill="currentColor" />
      </span>
      eBPF<span className="brand-tag">/</span>
    </span>
  );
}
function KernelArt() {
  return (
    <div
      className="kernel-art"
      aria-label="Schema: Anwendungen senden Ereignisse an eBPF-Programme im Linux-Kernel"
    >
      <div className="art-grid" />
      <div className="art-caption">
        <span className="green-dot" /> EVENT-DRIVEN BY DESIGN
      </div>
      <div className="app-nodes">
        <span>
          <Terminal size={17} /> app.py
        </span>
        <span>
          <Network size={17} /> network
        </span>
        <span>
          <Eye size={17} /> tracing
        </span>
      </div>
      <div className="signal-paths">
        <i />
        <i />
        <i />
      </div>
      <div className="kernel-box">
        <div className="kernel-box-header">
          <span>
            <span className="orange-dot" /> LINUX KERNEL
          </span>
          <span>↓ events</span>
        </div>
        <div className="bpf-row">
          <div className="bpf-chip">
            <Zap size={21} />
            <span>
              eBPF<strong>PROGRAM</strong>
            </span>
          </div>
          <div className="chip-arrow">⇄</div>
          <div className="map-chip">
            <span>MAPS</span>
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="hook-line">
          <span>HOOK</span>
          <span>HOOK</span>
          <span>HOOK</span>
        </div>
      </div>
      <div className="kernel-bottom">
        <span>OBSERVE</span>
        <span>CONTROL</span>
        <span>PROTECT</span>
      </div>
      <div className="art-footnote">
        <Code2 size={14} /> Small programs. Kernel-level possibilities.
      </div>
    </div>
  );
}
type Controls = {
  lab: Lab;
  mode: string;
  audience: boolean;
  updateLab: (p: Partial<Lab>) => void;
  send: (n: number) => void;
  resetLab: () => void;
};
function SlideContent({
  index,
  answers,
  toggleAnswer,
  ...controls
}: Controls & {
  index: number;
  answers: number[];
  toggleAnswer: (i: number) => void;
}) {
  const s = slides[index];
  return (
    <article className={`slide slide-${s.kind}`} key={index}>
      <div className="slide-heading">
        <span className="eyebrow">{s.label}</span>
        {s.kind === "intro" ? (
          <>
            <h1>
              eBPF<span className="title-period">.</span>
            </h1>
            <h2>
              Kleine Programme.
              <br />
              Große Wirkung.
            </h2>
            <p>{s.description}</p>
          </>
        ) : (
          <>
            <h1>{s.title}</h1>
            <p>{s.description}</p>
          </>
        )}
      </div>
      {s.kind === "intro" && (
        <>
          <KernelArt />
          <div className="intro-bottom">
            <div className="intro-label">
              DREI PERSPEKTIVEN.
              <br />
              <strong>EINE TECHNOLOGIE.</strong>
            </div>
            {[
              [Eye, "01", "Beobachten", "Verbindungen sichtbar machen."],
              [
                GitBranch,
                "02",
                "Verteilen",
                "Verkehr ans richtige Ziel bringen.",
              ],
              [ShieldCheck, "03", "Absichern", "Unerwünschte Pakete stoppen."],
            ].map(([Icon, num, title, text]) => {
              const I = Icon as typeof Eye;
              return (
                <div className="intro-feature" key={String(num)}>
                  <div>
                    <I size={19} />
                    <span>{String(num)}</span>
                  </div>
                  <h3>{String(title)}</h3>
                  <p>{String(text)}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
      {s.kind === "concept" && (
        <div className="concept-layout">
          <KernelArt />
          <div className="concept-list">
            {s.items?.map(([a, b], i) => (
              <div key={a}>
                <span>0{i + 1}</span>
                <h3>{a}</h3>
                <p>{b}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {s.kind === "lifecycle" && (
        <>
          <div className="lifecycle">
            {[
              "Bytecode laden",
              "Verifier prüft",
              "JIT übersetzt",
              "Hook anbinden",
              "Ereignis ausführen",
            ].map((name, i) => (
              <React.Fragment key={name}>
                <div>
                  <span>0{i + 1}</span>
                  <h3>{name}</h3>
                  <small>
                    {
                      [
                        "Programm vorbereiten",
                        "Zulässigkeit prüfen",
                        "Wenn unterstützt",
                        "Kontext festlegen",
                        "Programm läuft",
                      ][i]
                    }
                  </small>
                </div>
                {i < 4 && <ArrowRight className="life-arrow" size={18} />}
              </React.Fragment>
            ))}
          </div>
          <div className="callout">
            <Zap size={20} />
            <span>
              Das Programm wartet nicht in einer Endlosschleife.{" "}
              <strong>Das Ereignis löst es aus.</strong>
            </span>
          </div>
        </>
      )}
      {(s.kind === "cards" || s.kind === "companies") && (
        <div className={`info-grid ${s.kind === "companies" ? "four" : ""}`}>
          {s.items?.map(([title, text], i) => (
            <div className="info-card" key={title}>
              <span className="card-index">
                0{i + 1}{" "}
                <span>{s.kind === "companies" ? "IN PRODUKTION" : "eBPF"}</span>
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
              {s.kind === "companies" && (
                <a
                  href={sources[[2, 3, 8, 7][i]][1]}
                  target="_blank"
                  rel="noreferrer"
                >
                  Primärquelle <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {s.kind === "maps" && (
        <>
          <div className="map-diagram">
            <div>
              <Terminal size={26} />
              <h3>Python / Userspace</h3>
              <p>Konfigurieren & auswerten</p>
            </div>
            <span>⇄</span>
            <div className="map-center">
              <h3>eBPF Maps</h3>
              <code>
                port: 9090
                <br />
                filter: aktiv
                <br />
                drop: 42
              </code>
            </div>
            <span>⇄</span>
            <div>
              <Zap size={26} />
              <h3>eBPF / Kernel</h3>
              <p>Ereignisse verarbeiten</p>
            </div>
          </div>
          <div className="small-facts">
            {s.items?.map(([a, b]) => (
              <div key={a}>
                <strong>{a}</strong>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {s.kind === "hooks" && (
        <div className="hook-diagram">
          <div className="hook-start">
            <Network size={20} /> Eingehendes Paket
          </div>
          {s.items?.map(([a, b], i) => (
            <div key={a} className="hook-item">
              <span>{["01", "02", "03", "04"][i]}</span>
              <strong>{a}</strong>
              <p>{b}</p>
              <span className="hook-badge">eBPF</span>
            </div>
          ))}
          <p className="muted">
            Vereinfachte Einordnung der Hook-Arten, kein universeller
            Paketablauf. Socket-Hooks und Tracepoints sind ereignisabhängig.
          </p>
        </div>
      )}
      {s.kind === "topology" && (
        <>
          <Topology lab={controls.lab} />
          <div className="small-facts">
            <div>
              <strong>Python</strong>
              <span>Anwendung, Requests und Auswertung</span>
            </div>
            <div>
              <strong>Cilium / Hubble</strong>
              <span>Datenpfad, Policies und Flow-Sicht</span>
            </div>
            <div>
              <strong>Linux-VM</strong>
              <span>Geplantes k3d-Labor + separates XDP-Testnetz</span>
            </div>
          </div>
        </>
      )}
      {s.kind === "lab" && <LabPanel {...controls} />}
      {s.kind === "questions" && (
        <div className="questions">
          {questions.map(([q, a], i) => (
            <div key={q}>
              <button
                aria-expanded={answers.includes(i)}
                disabled={controls.audience}
                onClick={() => toggleAnswer(i)}
              >
                <span>0{i + 1}</span>
                <strong>{q}</strong>
                <span className={answers.includes(i) ? "rotate" : ""}>
                  <ChevronRight size={20} />
                </span>
              </button>
              {answers.includes(i) && <p>{a}</p>}
            </div>
          ))}
        </div>
      )}
      {s.kind === "sources" && (
        <div className="source-grid">
          {sources.map(([title, url], i) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              <span>{String(i + 1).padStart(2, "0")}</span>
              <strong>{title}</strong>
              <ArrowUpRight size={16} />
            </a>
          ))}
        </div>
      )}
      {s.kind !== "intro" && (
        <div className="citations">
          QUELLEN{" "}
          {s.sourceIds.map((i) => (
            <a key={i} href={sources[i][1]} target="_blank" rel="noreferrer">
              [{i + 1}] {sources[i][0]} <ArrowUpRight size={10} />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
function Topology({ lab }: { lab: Lab }) {
  return (
    <div className="topology">
      <div className="clients">
        <div
          className={`topo-node ${lab.client === "trusted" ? "node-active" : ""}`}
        >
          <Terminal size={21} />
          <strong>Client A</strong>
          <small>berechtigt</small>
        </div>
        <div
          className={`topo-node ${lab.client === "guest" ? "node-active" : ""}`}
        >
          <Terminal size={21} />
          <strong>Client B</strong>
          <small>weiterer Client</small>
        </div>
      </div>
      <div className="topo-wire">
        <span className="flow-dot" />
      </div>
      <div className="topo-node service">
        <Network size={27} />
        <strong>web:8080</strong>
        <small>Service-Adresse</small>
      </div>
      <div className="topo-wire">
        <span className="flow-dot delayed" />
      </div>
      <div className="backends">
        <div className="topo-node">
          <span className="backend-label">A</span>
          <strong>backend-a</strong>
          <small>Python HTTP</small>
        </div>
        <div className="topo-node">
          <span className="backend-label">B</span>
          <strong>backend-b</strong>
          <small>Python HTTP</small>
        </div>
      </div>
    </div>
  );
}
function LabPanel({
  lab,
  mode,
  audience,
  updateLab,
  send,
  resetLab,
}: Controls) {
  const xdp = mode === "xdp";
  const blocked = xdp ? lab.filter : lab.policy;
  return (
    <section className="lab">
      <div className="lab-top">
        <span className="simulation-tag">
          <span /> BROWSER-SIMULATION
        </span>
        <span>
          <Radio size={13} />{" "}
          {xdp
            ? "XDP · separates Testnetz"
            : "Cilium · modellierter Servicepfad"}
        </span>
      </div>
      <div className="lab-grid">
        <div className="lab-visual">
          {xdp ? (
            <div className="xdp-diagram">
              <div className="packet-card">
                <Network size={24} />
                <span>TCP-Paket</span>
                <strong>:{lab.port}</strong>
              </div>
              <div className="vertical-wire">
                <span />
              </div>
              <div className={`xdp-filter ${blocked ? "filter-active" : ""}`}>
                <Zap size={22} />
                <strong>XDP HOOK</strong>
                <small>
                  {blocked ? "Filter aktiv · TCP/9090" : "Filter inaktiv"}
                </small>
              </div>
              <div
                className={`decision ${blocked && lab.port === 9090 ? "drop" : "pass"}`}
              >
                {blocked && lab.port === 9090 ? (
                  <X size={18} />
                ) : (
                  <Check size={18} />
                )}{" "}
                {blocked && lab.port === 9090 ? "XDP_DROP" : "XDP_PASS"}
                <small>
                  {blocked && lab.port === 9090
                    ? "Paket wird verworfen"
                    : "Weiter zum Netzwerkstack"}
                </small>
              </div>
            </div>
          ) : (
            <Topology lab={lab} />
          )}
          <div className="lab-counters">
            {[
              ["Gesendet", lab.sent, ""],
              [xdp ? "PASS" : "Erlaubt", lab.pass, "pass"],
              [xdp ? "DROP" : "Blockiert", lab.drop, "drop"],
            ].map(([title, value, color]) => (
              <div key={title}>
                <span>{title}</span>
                <strong className={String(color)}>{value}</strong>
              </div>
            ))}
          </div>
          {!xdp && (
            <div className="backend-distribution">
              <span>Backend-Antworten</span>
              <div>
                <i
                  style={{
                    width: `${lab.a + lab.b ? (lab.a / (lab.a + lab.b)) * 100 : 50}%`,
                  }}
                />
              </div>
              <p>
                <span>
                  A <b>{lab.a}</b>
                </span>
                <span>
                  B <b>{lab.b}</b>
                </span>
              </p>
            </div>
          )}
        </div>
        <div className="lab-console">
          <div className="console-title">
            <span>
              <Terminal size={14} />{" "}
              {xdp ? "packet_filter.pseudo" : "network_policy.pseudo"}
            </span>
            <span>PSEUDOCODE</span>
          </div>
          <pre>
            {xdp ? (
              <>
                <span className="code-comment">
                  # vereinfachtes Erklärmodell
                </span>
                {"\n"}
                <span className="code-purple">wenn</span> filter_aktiv{"\n"}{" "}
                <span className="code-purple">und</span> tcp_zielport =={" "}
                <span className="code-orange">9090</span>:{"\n"} drop_zaehler +=
                1{"\n"} <span className="code-purple">return</span>{" "}
                <span className="code-red">XDP_DROP</span>
                {"\n\n"}pass_zaehler += 1{"\n"}
                <span className="code-purple">return</span>{" "}
                <span className="code-green">XDP_PASS</span>
              </>
            ) : (
              <>
                <span className="code-comment">
                  # modellierte Ingress-Regel
                </span>
                {"\n"}
                <span className="code-purple">wenn</span> policy_aktiv{"\n"}{" "}
                <span className="code-purple">und</span> quelle !={" "}
                <span className="code-orange">client_a</span>:{"\n"}{" "}
                <span className="code-purple">return</span>{" "}
                <span className="code-red">DROP</span>
                {"\n\n"}backend = waehle_backend(){"\n"}
                <span className="code-purple">return</span>{" "}
                <span className="code-green">ALLOW</span>
              </>
            )}
          </pre>
          <div className="event-log" aria-live="polite">
            <div className="log-heading">
              {xdp ? "PAKET-ENTSCHEIDUNGEN" : "NEUE VERBINDUNGEN"}{" "}
              <span>
                {lab.events.length
                  ? "LETZTE " + Math.min(30, lab.sent)
                  : "BEREIT"}
              </span>
            </div>
            {lab.events.length ? (
              lab.events
                .slice(0, 5)
                .map(
                  (event: {
                    id: number;
                    action: string;
                    port: number;
                    backend: string | null;
                    reason: string;
                  }) => (
                    <div className="log-row" key={event.id}>
                      <span>#{String(event.id).padStart(3, "0")}</span>
                      <b className={event.action === "DROP" ? "drop" : "pass"}>
                        {event.action}
                      </b>
                      <span>
                        {xdp
                          ? `TCP/${event.port}`
                          : event.backend
                            ? `backend-${event.backend}`
                            : "Policy-Drop"}
                      </span>
                    </div>
                  ),
                )
            ) : (
              <div className="empty-log">
                Warte auf {xdp ? "Pakete" : "Verbindungen"}
                <span className="cursor">_</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="lab-controls">
        {!audience ? (
          <>
            <label>
              {xdp ? "TCP-Zielport" : "Quelle"}
              <select
                value={xdp ? lab.port : lab.client}
                onChange={(e) =>
                  updateLab(
                    xdp
                      ? { port: Number(e.target.value) }
                      : { client: e.target.value },
                  )
                }
              >
                {xdp ? (
                  <>
                    <option value="8080">8080 · Kontrollport</option>
                    <option value="9090">9090 · Filterport</option>
                  </>
                ) : (
                  <>
                    <option value="trusted">Client A · berechtigt</option>
                    <option value="guest">Client B · weiterer Client</option>
                  </>
                )}
              </select>
            </label>
            <button
              className={`toggle ${blocked ? "toggled" : ""}`}
              role="switch"
              aria-checked={blocked}
              onClick={() =>
                updateLab(
                  xdp ? { filter: !lab.filter } : { policy: !lab.policy },
                )
              }
            >
              <span>
                <i />
              </span>
              {xdp ? "9090 sperren" : "Policy aktivieren"}
            </button>
            <div className="send-actions">
              <button className="send-one" onClick={() => send(1)}>
                <Play size={14} /> {xdp ? "Paket senden" : "Verbinden"}
              </button>
              <button onClick={() => send(10)}>+10</button>
              <button
                className="icon-btn"
                onClick={resetLab}
                aria-label="Simulation zurücksetzen"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </>
        ) : (
          <span className="audience-lab-label">
            Steuerung über die Referentenansicht ·{" "}
            {blocked ? "Regel aktiv" : "Regel inaktiv"}
          </span>
        )}
      </div>
      <p className="lab-disclaimer">
        {xdp
          ? "Modell eines Portfilters. Kein eBPF-Code wird ausgeführt; PASS/DROP zählen hier simulierte TCP-Pakete."
          : "Modell von neuen Verbindungen. Zufällige Backend-Auswahl; keine garantierte 50:50-Verteilung. Zähler messen keine echten Flows."}
      </p>
    </section>
  );
}
export default App;
