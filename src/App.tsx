import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  Edit3,
  Grid2X2,
  Maximize2,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  StickyNote,
  X,
} from "lucide-react";
import { slides, sources, questions } from "./deck";
import { initialLab, sendPackets, readSnapshot } from "./model.mjs";
import "@fontsource-variable/dm-sans/wght.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./styles.css";

type PacketEvent = {
  id: number;
  action: string;
  reason: string;
  backend: string | null;
  port: number;
  client: string;
};
type Lab = Omit<typeof initialLab, "events"> & { events: PacketEvent[] };
type Snapshot = { index: number; black: boolean; lab: Lab; answers: number[] };
const KEY = "ebpf-deck-v1";
const audience =
  new URLSearchParams(location.search).get("view") === "audience";
const freshLab = (): Lab => ({ ...initialLab, events: [] });
function stored(): Snapshot {
  try {
    return (
      (readSnapshot(
        JSON.parse(localStorage.getItem(KEY) || "null"),
        slides.length,
      ) as Snapshot) || { index: 0, black: false, lab: freshLab(), answers: [] }
    );
  } catch {
    return { index: 0, black: false, lab: freshLab(), answers: [] };
  }
}
function readNotes(): Record<number, string> {
  try {
    const v = JSON.parse(localStorage.getItem("ebpf-notes") || "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}
export default function App() {
  const [state, setState] = useState<Snapshot>(stored);
  const [notes, setNotes] = useState(true);
  const [fontSize, setFontSize] = useState(22);
  const [customNotes, setCustomNotes] = useState(readNotes);
  const [modal, setModal] = useState<"overview" | "help" | "edit" | null>(null);
  const [draft, setDraft] = useState("");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [connected, setConnected] = useState(false);
  const [notice, setNotice] = useState("");
  const channel = useRef<BroadcastChannel | null>(null);
  const current = useRef(state);
  current.current = state;
  const lastAudience = useRef(0);
  const origin = useRef(0);
  const elapsed = useRef(0);
  const slide = slides[state.index];
  const mode = state.index === 11 ? "xdp" : "network";
  const speak =
    typeof customNotes[state.index] === "string"
      ? customNotes[state.index]
      : slide.notes;
  useEffect(() => {
    let bus: BroadcastChannel | null = null;
    try {
      bus = new BroadcastChannel(KEY);
      channel.current = bus;
    } catch {
      /* storage fallback */
    }
    if (bus)
      bus.onmessage = (e) => {
        const m = e.data || {};
        if (m.type === "hello" && !audience) {
          lastAudience.current = Date.now();
          setConnected(true);
          bus?.postMessage({ type: "state", value: current.current });
        }
        if (m.type === "state" && audience) {
          const next = readSnapshot(m.value, slides.length);
          if (next) setState(next as Snapshot);
        }
      };
    const storage = (e: StorageEvent) => {
      if (audience && e.key === KEY) {
        try {
          const next = readSnapshot(
            JSON.parse(e.newValue || "null"),
            slides.length,
          );
          if (next) setState(next as Snapshot);
        } catch {
          /* ignore invalid state */
        }
      }
    };
    window.addEventListener("storage", storage);
    if (audience) bus?.postMessage({ type: "hello" });
    const heartbeat = setInterval(() => {
      if (audience) bus?.postMessage({ type: "hello" });
      else setConnected(Date.now() - lastAudience.current < 6500);
    }, 2000);
    return () => {
      clearInterval(heartbeat);
      bus?.close();
      channel.current = null;
      window.removeEventListener("storage", storage);
    };
  }, []);
  useEffect(() => {
    if (!audience) {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {
        /* channel remains available */
      }
      channel.current?.postMessage({ type: "state", value: state });
    }
  }, [state]);
  useEffect(() => {
    if (!running) return;
    origin.current = Date.now();
    const id = setInterval(
      () =>
        setSeconds(
          elapsed.current + Math.floor((Date.now() - origin.current) / 1000),
        ),
      250,
    );
    return () => {
      elapsed.current += Math.floor((Date.now() - origin.current) / 1000);
      clearInterval(id);
    };
  }, [running]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(id);
  }, [notice]);
  const go = (target: number) => {
    if (audience) return;
    const index = Math.max(0, Math.min(slides.length - 1, target));
    setState((s) => ({
      ...s,
      index,
      black: false,
      lab: (s.index === 11) !== (index === 11) ? freshLab() : s.lab,
    }));
  };
  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
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
      if (e.key.toLowerCase() === "f" && !modal) {
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
      if (e.key.toLowerCase() === "n") setNotes((v) => !v);
      if (e.key.toLowerCase() === "b")
        setState((s) => ({ ...s, black: !s.black }));
      if (e.key === "?") setModal("help");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [modal]);
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
        "Popup blockiert. In der Hilfe kannst du die Zuschaueransicht als normalen Tab öffnen.",
      );
      return;
    }
    setNotes(true);
    setRunning(true);
    setNotice(
      "Zuschauerfenster auf den zweiten Bildschirm ziehen. Dort F für Vollbild drücken.",
    );
  }
  function downloadHandout() {
    const content =
      "# eBPF im Linux-Netzwerk\n\n" +
      slides
        .filter((s) => s.kind !== "sources")
        .map(
          (s) =>
            `## ${s.title}\n\n${s.bullets.map((v) => "- " + v).join("\n")}\n\n${s.notes}\n`,
        )
        .join("\n") +
      "\n## Fragen mit Antworten\n\n" +
      questions.map(([q, a]) => q + "\n\n" + a).join("\n\n") +
      "\n\n## Quellen\n\n" +
      sources.map(([s, u]) => `- [${s}](${u})`).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([content], { type: "text/markdown;charset=utf-8" }),
    );
    link.download = "eBPF-Handout.md";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  const updateLab = (patch: Partial<Lab>) =>
    setState((s) => ({ ...s, lab: { ...s.lab, ...patch } }));
  const send = (n: number) =>
    setState((s) => ({ ...s, lab: sendPackets(s.lab, mode, n) }));
  const toggleAnswer = (i: number) =>
    setState((s) => ({
      ...s,
      answers: s.answers.includes(i)
        ? s.answers.filter((v) => v !== i)
        : [...s.answers, i],
    }));
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const deck = (
    <SlideContent index={state.index} lab={state.lab} answers={state.answers} />
  );
  if (audience)
    return (
      <main
        className={`audience ${state.black ? "blacked" : ""}`}
        aria-label="Zuschaueransicht"
      >
        <SlideFrame black={state.black}>{deck}</SlideFrame>
        <button
          className="audience-fullscreen"
          onClick={fullscreen}
          aria-label="Vollbild"
        >
          <Maximize2 size={20} />
        </button>
      </main>
    );
  return (
    <div className="presenter-app">
      <header className="app-bar">
        <span className="document-name">
          eBPF <span>· Linux-Netzwerke</span>
        </span>
        <div className="app-actions">
          <button onClick={() => setModal("overview")}>
            <Grid2X2 size={17} />
            <span>Folien</span>
          </button>
          <button aria-pressed={notes} onClick={() => setNotes((v) => !v)}>
            <StickyNote size={17} />
            <span>Sprechtext</span>
          </button>
          <button aria-label="Hilfe" onClick={() => setModal("help")}>
            <CircleHelp size={18} />
          </button>
          <button className="primary" onClick={openAudience}>
            <Monitor size={17} />
            <span>Präsentieren</span>
          </button>
        </div>
      </header>
      <main
        className={`presenter-body ${notes ? "has-notes" : ""}`}
        id="content"
      >
        <section className="preview-column" aria-label="Aktuelle Folie">
          <div className="preview-label">
            <span>Aktuelle Folie</span>
            <span>
              {state.index + 1} / {slides.length}
            </span>
          </div>
          <SlideFrame black={false}>{deck}</SlideFrame>
          {state.black && (
            <div className="black-status">
              Zuschauerbild schwarz · B zum Fortsetzen
            </div>
          )}
          {slide.kind === "lab" && (
            <LabControls
              mode={mode}
              lab={state.lab}
              updateLab={updateLab}
              send={send}
              reset={() => setState((s) => ({ ...s, lab: freshLab() }))}
            />
          )}
          {slide.kind === "questions" && (
            <div className="answer-controls">
              {questions.map((_, i) => (
                <button
                  key={i}
                  aria-pressed={state.answers.includes(i)}
                  onClick={() => toggleAnswer(i)}
                >
                  Antwort {i + 1}{" "}
                  {state.answers.includes(i) ? "ausblenden" : "zeigen"}
                </button>
              ))}
            </div>
          )}
          <div className="next-slide">
            <span>Als Nächstes</span>
            <strong>
              {slides[state.index + 1]?.title || "Ende der Präsentation"}
            </strong>
          </div>
        </section>
        {notes && (
          <aside className="speaker-pane" aria-label="Referentennotizen">
            <div className="speaker-toolbar">
              <h2>Sprechtext</h2>
              <div>
                <button
                  aria-label="Sprechtext verkleinern"
                  disabled={fontSize <= 18}
                  onClick={() => setFontSize((v) => v - 2)}
                >
                  A−
                </button>
                <button
                  aria-label="Sprechtext vergrößern"
                  disabled={fontSize >= 30}
                  onClick={() => setFontSize((v) => v + 2)}
                >
                  A+
                </button>
                <button
                  aria-label="Sprechtext bearbeiten"
                  onClick={() => {
                    setDraft(speak);
                    setModal("edit");
                  }}
                >
                  <Edit3 size={17} />
                </button>
              </div>
            </div>
            <PagedNotes
              key={state.index}
              text={speak}
              fontSize={fontSize}
              paused={!!modal}
            />
            <div className="speaker-timing">
              <div>
                <span>Gesamtzeit</span>
                <strong className={seconds >= 2160 ? "overtime" : ""}>
                  {time}
                </strong>
              </div>
              <button
                onClick={() => setRunning((v) => !v)}
                aria-label={running ? "Timer pausieren" : "Timer starten"}
              >
                {running ? <Pause size={19} /> : <Play size={19} />}
              </button>
              <button
                aria-label="Timer zurücksetzen"
                onClick={() => {
                  setRunning(false);
                  elapsed.current = 0;
                  setSeconds(0);
                }}
              >
                <RotateCcw size={17} />
              </button>
              <span>
                Folienrichtzeit
                <br />
                <b>{slide.time}</b>
              </span>
            </div>
          </aside>
        )}
      </main>
      <footer className="control-bar">
        <button
          disabled={state.index === 0}
          onClick={() => go(state.index - 1)}
          aria-label="Vorherige Folie"
        >
          <ArrowLeft size={20} />
        </button>
        <button className="slide-picker" onClick={() => setModal("overview")}>
          {state.index + 1} / {slides.length}
          <span>{slide.short}</span>
        </button>
        <button
          disabled={state.index === slides.length - 1}
          onClick={() => go(state.index + 1)}
          aria-label="Nächste Folie"
        >
          <ArrowRight size={20} />
        </button>
        <div className="footer-spacer" />
        <span className={`connection ${connected ? "connected" : ""}`}>
          <i />
          {connected ? "Zuschauer verbunden" : "Referentenansicht"}
        </span>
        <button
          aria-pressed={state.black}
          onClick={() => setState((s) => ({ ...s, black: !s.black }))}
          title="Zuschauerbild schwarz (B)"
        >
          <span className="black-icon" />
        </button>
        <button aria-label="Vollbild" onClick={fullscreen}>
          <Maximize2 size={18} />
        </button>
      </footer>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="Hinweis schließen" onClick={() => setNotice("")}>
            <X size={18} />
          </button>
        </div>
      )}
      {modal && (
        <Dialog
          label={
            modal === "overview"
              ? "Folienübersicht"
              : modal === "edit"
                ? "Sprechtext bearbeiten"
                : "Bedienung"
          }
          close={() => setModal(null)}
          wide={modal === "overview"}
        >
          {modal === "overview" ? (
            <>
              <h2>Folienübersicht</h2>
              <div className="slide-grid">
                {slides.map((s, i) => (
                  <button
                    key={i}
                    className={i === state.index ? "selected" : ""}
                    onClick={() => {
                      go(i);
                      setModal(null);
                    }}
                  >
                    <span>
                      {String(i + 1).padStart(2, "0")} · {s.section}
                    </span>
                    <strong>{s.title}</strong>
                    {s.kind === "lab" && <small>Simulation</small>}
                  </button>
                ))}
              </div>
              <button className="handout-download" onClick={downloadHandout}>
                <Download size={17} /> Handout herunterladen
              </button>
            </>
          ) : modal === "edit" ? (
            <>
              <h2>Sprechtext bearbeiten</h2>
              <p className="dialog-hint">
                {slide.title} · Nur in diesem Browser gespeichert.
              </p>
              <textarea
                autoFocus
                className="notes-editor"
                aria-label="Sprechtext bearbeiten"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="dialog-actions">
                <button onClick={() => setDraft(slide.notes)}>
                  Originaltext einsetzen
                </button>
                <button
                  className="primary"
                  onClick={() => {
                    const next = { ...customNotes, [state.index]: draft };
                    setCustomNotes(next);
                    try {
                      localStorage.setItem("ebpf-notes", JSON.stringify(next));
                    } catch {
                      setNotice(
                        "Änderung gilt nur für diese Sitzung: Der Browserspeicher ist nicht verfügbar.",
                      );
                    }
                    setModal(null);
                  }}
                >
                  Speichern
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>Präsentation bedienen</h2>
              <ol>
                <li>
                  In macOS den zweiten Bildschirm als erweiterten Bildschirm
                  verwenden.
                </li>
                <li>
                  „Präsentieren“ anklicken und das Zuschauerfenster auf den
                  zweiten Bildschirm ziehen.
                </li>
                <li>
                  Dort mit <kbd>F</kbd> Vollbild aktivieren. In einer Konferenz
                  nur dieses Fenster oder diesen Bildschirm teilen.
                </li>
              </ol>
              <p>
                Der Sprechtext bleibt auf dem MacBook. Er hat einen festen
                Platz; längere Texte werden in Abschnitte aufgeteilt.
              </p>
              <div className="shortcuts">
                {[
                  ["← / →", "Folie zurück / weiter"],
                  ["↑ / ↓", "Sprechtextabschnitt zurück / weiter"],
                  ["N", "Sprechtext ein- / ausblenden"],
                  ["B", "Zuschauerbild schwarz / fortsetzen"],
                  ["F", "Vollbild im aktuellen Fenster"],
                  ["Home / End", "Erste / letzte Folie"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <kbd>{k}</kbd>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
              <a
                className="viewer-link"
                href="?view=audience"
                target="ebpf-audience"
              >
                Zuschaueransicht als Tab öffnen ↗
              </a>
              <p className="dialog-hint">
                Beide Ansichten im gleichen Browserprofil und auf demselben
                Ursprung öffnen. Die Demo führt keine eBPF-Programme aus.
              </p>
              <button className="handout-download" onClick={downloadHandout}>
                <Download size={17} /> Handout herunterladen
              </button>
            </>
          )}
        </Dialog>
      )}
    </div>
  );
}

function SlideFrame({
  children,
  black,
}: {
  children: React.ReactNode;
  black: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const resize = () => {
      if (host.current)
        setScale(
          Math.min(
            host.current.clientWidth / 1600,
            host.current.clientHeight / 900,
          ),
        );
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={host}
      className={`slide-frame ${black ? "frame-black" : ""}`}
      data-scale={scale}
    >
      <div
        className="slide-surface"
        style={{
          transform: `translate(-50%, -50%) scale(${scale})`,
          visibility: scale && !black ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function PagedNotes({
  text,
  fontSize,
  paused,
}: {
  text: string;
  fontSize: number;
  paused: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<string[]>([text]);
  const [page, setPage] = useState(0);
  useLayoutEffect(() => {
    const resize = () => {
      const box = viewport.current,
        probe = measure.current;
      if (!box || !probe || box.clientHeight < 1) return;
      probe.style.width = box.clientWidth + "px";
      const tokens = text.split(/(\s+)/);
      const result: string[] = [];
      let start = 0;
      while (start < tokens.length) {
        let low = start + 1,
          high = tokens.length,
          best = start + 1;
        while (low <= high) {
          const end = Math.floor((low + high) / 2);
          probe.textContent = tokens.slice(start, end).join("").trim();
          if (probe.scrollHeight <= box.clientHeight - 8) {
            best = end;
            low = end + 1;
          } else high = end - 1;
        }
        if (best < tokens.length) {
          for (
            let boundary = best;
            boundary > start + (best - start) * 0.55;
            boundary--
          ) {
            if (
              /[.!?]$/.test(tokens[boundary - 1].trim()) ||
              /\n\s*\n/.test(tokens[boundary - 1])
            ) {
              best = boundary;
              break;
            }
          }
        }
        result.push(tokens.slice(start, best).join("").trim());
        start = best;
      }
      setPages(result.length ? result : ["Kein Sprechtext hinterlegt."]);
      setPage(0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (viewport.current) observer.observe(viewport.current);
    document.fonts.ready.then(resize);
    return () => observer.disconnect();
  }, [text, fontSize]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        paused ||
        (e.target as HTMLElement).closest("input,textarea,select") ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPage((v) => Math.min(v + 1, pages.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setPage((v) => Math.max(0, v - 1));
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [pages.length, paused]);
  return (
    <div className="paged-notes" style={{ fontSize }}>
      <div className="notes-viewport" ref={viewport}>
        <div className="notes-text">
          {pages[Math.min(page, pages.length - 1)]}
        </div>
        <div className="notes-measure" aria-hidden="true" ref={measure} />
      </div>
      <div className="notes-pagination">
        <span>
          {pages.length > 1
            ? `Abschnitt ${page + 1} von ${pages.length}`
            : "Vollständiger Sprechtext"}
        </span>
        <button
          aria-label="Vorheriger Sprechtextabschnitt"
          disabled={page === 0}
          onClick={() => setPage((v) => Math.max(0, v - 1))}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          aria-label="Nächster Sprechtextabschnitt"
          disabled={page >= pages.length - 1}
          onClick={() => setPage((v) => Math.min(pages.length - 1, v + 1))}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

function Dialog({
  children,
  label,
  close,
  wide,
}: {
  children: React.ReactNode;
  label: string;
  close: () => void;
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const focusables = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),a[href],textarea,input,select",
        ) || [],
      );
    focusables()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const all = focusables(),
        first = all[0],
        last = all[all.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, []);
  return (
    <div className="dialog-backdrop" onClick={close}>
      <div
        ref={panel}
        className={`dialog ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="dialog-close"
          onClick={close}
          aria-label="Dialog schließen"
        >
          <X size={22} />
        </button>
        {children}
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="slide-bullets">
      {items.map((v) => (
        <li key={v}>{v}</li>
      ))}
    </ul>
  );
}
function FlowNode({
  label,
  detail,
  accent = false,
}: {
  label: string;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <div className={`flow-node ${accent ? "accent" : ""}`}>
      <strong>{label}</strong>
      {detail && <span>{detail}</span>}
    </div>
  );
}
function Arrow() {
  return (
    <span className="diagram-arrow" aria-hidden="true">
      →
    </span>
  );
}
function Topology() {
  return (
    <div className="topology">
      <div className="node-stack">
        <FlowNode label="Client A" detail="berechtigt" />
        <FlowNode label="Client B" detail="weiterer Client" />
      </div>
      <Arrow />
      <FlowNode label="web:8080" detail="Service-Adresse" accent />
      <Arrow />
      <div className="node-stack">
        <FlowNode label="backend-a" detail="Python-Webserver" />
        <FlowNode label="backend-b" detail="Python-Webserver" />
      </div>
    </div>
  );
}
function SlideContent({
  index,
  lab,
  answers,
}: {
  index: number;
  lab: Lab;
  answers: number[];
}) {
  const s = slides[index];
  return (
    <article
      className={`slide slide-${s.kind}`}
      aria-label={`Folie ${index + 1}: ${s.title}`}
    >
      {s.kind === "title" ? (
        <>
          <div className="title-subject">Linux-Netzwerke</div>
          <h1>eBPF</h1>
          <p className="title-subtitle">
            Netzwerkverkehr beobachten,
            <br />
            verteilen und absichern
          </p>
          <ol className="agenda">
            {s.bullets.map((v, i) => (
              <li key={v}>
                <span>{i + 1}</span>
                {v}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <header className="slide-header">
            <h1>{s.title}</h1>
          </header>
          <div className="slide-body">
            {s.kind === "definition" && (
              <>
                <p className="definition">
                  Mit eBPF führt Linux geprüfte Programme aus,
                  <br />
                  sobald ein passendes Kernelereignis eintritt.
                </p>
                <div className="kernel-schema">
                  <div className="user-layer">
                    <strong>Userspace</strong>
                    <span>Python-Anwendung · Konfiguration · Auswertung</span>
                  </div>
                  <div className="kernel-layer">
                    <strong>Linux-Kernel</strong>
                    <div>
                      <FlowNode label="Ereignis" detail="z. B. Paketempfang" />
                      <Arrow />
                      <FlowNode
                        label="Hook"
                        detail="definierter Einsatzpunkt"
                      />
                      <Arrow />
                      <FlowNode
                        label="eBPF-Programm"
                        detail="verarbeitet den Kontext"
                        accent
                      />
                    </div>
                  </div>
                </div>
                <BulletList items={s.bullets} />
              </>
            )}
            {s.kind === "lifecycle" && (
              <>
                <div className="lifecycle">
                  <div className="flow-caption">Einmal beim Einrichten</div>
                  <div className="flow-row">
                    <FlowNode label="Bytecode laden" />
                    <Arrow />
                    <FlowNode label="Verifier" detail="prüfen" />
                    <Arrow />
                    <FlowNode label="JIT" detail="falls unterstützt" />
                    <Arrow />
                    <FlowNode label="Hook anbinden" accent />
                  </div>
                  <div className="runtime-row">
                    <span>Bei jedem passenden Ereignis</span>
                    <FlowNode label="Paket kommt an" />
                    <Arrow />
                    <FlowNode label="Programm läuft" accent />
                    <Arrow />
                    <FlowNode label="PASS oder DROP" />
                  </div>
                </div>
                <BulletList items={s.bullets} />
              </>
            )}
            {s.kind === "verifier" && (
              <>
                <div className="verifier-example">
                  <div className="example-label">
                    Beispiel: TCP-Header aus einem Paket lesen
                  </div>
                  <div className="check-line">
                    <span>1</span>
                    <strong>
                      Sind die benötigten Bytes im Paket vorhanden?
                    </strong>
                  </div>
                  <div className="check-line">
                    <span>2</span>
                    <strong>Erst nach dieser Prüfung den Header lesen.</strong>
                  </div>
                  <p>
                    Der Verifier muss die Zugriffsgrenzen nachvollziehen können.
                  </p>
                </div>
                <BulletList items={s.bullets} />
              </>
            )}
            {s.kind === "maps" && (
              <>
                <div className="maps-example">
                  <div className="maps-roles">
                    <FlowNode
                      label="Python / Userspace"
                      detail="Regel setzen · Zähler lesen"
                    />
                    <span className="diagram-arrow">↕</span>
                  </div>
                  <div className="map-tables">
                    <div>
                      <h2>Regel-Map</h2>
                      <table>
                        <thead>
                          <tr>
                            <th>TCP-Port</th>
                            <th>gesperrt</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>9090</td>
                            <td>ja</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <h2>Zähler-Map</h2>
                      <table>
                        <thead>
                          <tr>
                            <th>Aktion</th>
                            <th>Anzahl</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>PASS</td>
                            <td>3</td>
                          </tr>
                          <tr>
                            <td>DROP</td>
                            <td>2</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="maps-roles">
                    <span className="diagram-arrow">↕</span>
                    <FlowNode
                      label="eBPF / Kernel"
                      detail="Regel lesen · Zähler erhöhen"
                      accent
                    />
                  </div>
                </div>
                <p className="example-note">
                  Beispielwerte nach fünf TCP-Paketen, davon zwei an den
                  gesperrten Port.
                </p>
                <BulletList items={s.bullets} />
              </>
            )}
            {s.kind === "hooks" && (
              <>
                <table className="teaching-table">
                  <thead>
                    <tr>
                      <th>Hook</th>
                      <th>Kontext / Zeitpunkt</th>
                      <th>Beispielaufgabe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "XDP",
                        "Eingehendes Paket",
                        "Früh PASS / DROP entscheiden",
                      ],
                      [
                        "TC",
                        "Paket am Netzwerkinterface",
                        "Pakete filtern oder umleiten",
                      ],
                      [
                        "Socket-Hooks",
                        "z. B. neuer Verbindungsaufbau",
                        "Service-Ziel auf Backend umsetzen",
                      ],
                      [
                        "Tracepoints",
                        "Definierte Kernelereignisse",
                        "Verbindungen und Zustände beobachten",
                      ],
                    ].map((row) => (
                      <tr key={row[0]}>
                        {row.map((v, i) =>
                          i === 0 ? <th key={i}>{v}</th> : <td key={i}>{v}</td>,
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <BulletList items={s.bullets} />
              </>
            )}
            {s.kind === "companies" && (
              <>
                <table className="teaching-table company-table">
                  <thead>
                    <tr>
                      <th>Unternehmen</th>
                      <th>System</th>
                      <th>Aufgabe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "Meta",
                        "Katran",
                        "Netzwerk-Lastverteilung mit eBPF/XDP",
                        2,
                      ],
                      [
                        "Netflix",
                        "Flow Exporter",
                        "TCP-Flows über eBPF-Tracepoints erfassen",
                        3,
                      ],
                      [
                        "Microsoft Azure",
                        "Azure CNI mit Cilium",
                        "eBPF-Datenpfad und Netzwerkrichtlinien",
                        8,
                      ],
                      [
                        "Cloudflare",
                        "L4Drop",
                        "Pakete zur DDoS-Abwehr verwerfen",
                        7,
                      ],
                    ].map(([company, system, task, id]) => (
                      <tr key={String(company)}>
                        <th>{company}</th>
                        <td>{system}</td>
                        <td>
                          {task}{" "}
                          <a
                            href={sources[Number(id)][1]}
                            target="_blank"
                            rel="noreferrer"
                          >
                            [{Number(id) + 1}]
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <BulletList items={s.bullets} />
              </>
            )}
            {s.kind === "topology" && (
              <>
                <Topology />
                <BulletList items={s.bullets} />
                <p className="scope-note">
                  Aktueller Stand: Browser-Simulation. Der Linux-Laboraufbau ist
                  noch umzusetzen.
                </p>
              </>
            )}
            {s.kind === "lab" && (
              <>
                <div className="simulation-label">
                  Browser-Simulation · keine Linux-Messung
                </div>
                <LabSlide lab={lab} index={index} />
                <BulletList items={s.bullets} />
              </>
            )}
            {s.kind === "results" && (
              <>
                <table className="teaching-table result-table">
                  <thead>
                    <tr>
                      <th>Versuch</th>
                      <th>Nachweis im Linux-Labor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>Beobachten</th>
                      <td>HTTP-Antwort + zugehöriges Flow-Ereignis</td>
                    </tr>
                    <tr>
                      <th>Lastverteilung</th>
                      <td>Neue TCP-Verbindungen → Antworten beider Backends</td>
                    </tr>
                    <tr>
                      <th>Netzwerkregel</th>
                      <td>Nur Client B blockiert + passender Policy-Drop</td>
                    </tr>
                    <tr>
                      <th>XDP-Portfilter</th>
                      <td>9090 blockiert, 8080 erreichbar + DROP-Differenz</td>
                    </tr>
                    <tr>
                      <th>Wiederherstellung</th>
                      <td>
                        Nach Entfernen der Regel beide Zugriffe erfolgreich
                      </td>
                    </tr>
                  </tbody>
                </table>
                <BulletList items={s.bullets} />
              </>
            )}
            {s.kind === "questions" && (
              <ol className="question-list">
                {questions.map(([q, a], i) => (
                  <li key={q}>
                    <div>
                      <span>{i + 1}</span>
                      <h2>{q}</h2>
                    </div>
                    {answers.includes(i) && <p>{a}</p>}
                  </li>
                ))}
              </ol>
            )}
            {s.kind === "sources" && (
              <ol className="source-list">
                {sources.map(([title, url], i) => (
                  <li key={url}>
                    <span>[{i + 1}]</span>
                    <a href={url} target="_blank" rel="noreferrer">
                      {title}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
      <footer className="slide-footer">
        <span>eBPF · Linux-Netzwerke</span>
        <span>
          {s.sourceIds.map((i) => (
            <a key={i} href={sources[i][1]} target="_blank" rel="noreferrer">
              [{i + 1}]
            </a>
          ))}
        </span>
        <span>
          {index + 1} / {slides.length}
        </span>
      </footer>
    </article>
  );
}

function LabSlide({ lab, index }: { lab: Lab; index: number }) {
  const xdp = index === 11;
  const dropped = xdp
    ? lab.filter && lab.port === 9090
    : lab.policy && lab.client === "guest";
  return (
    <div className={`lab-slide ${xdp ? "xdp" : ""}`}>
      <div className="lab-main">
        {xdp ? (
          <>
            <div className="packet-route">
              <FlowNode label={`TCP / ${lab.port}`} detail="Paket am Empfang" />
              <Arrow />
              <FlowNode
                label="XDP-Portregel"
                detail={lab.filter ? "9090 gesperrt" : "Filter deaktiviert"}
                accent
              />
              <Arrow />
              <div className={`verdict ${dropped ? "drop" : "pass"}`}>
                <strong>{dropped ? "DROP" : "PASS"}</strong>
                <span>{dropped ? "verwerfen" : "weiterreichen"}</span>
              </div>
            </div>
            <div className="rule-code">
              <span>Pseudocode</span>
              <code>
                wenn Filter aktiv und TCP-Zielport = 9090: DROP
                <br />
                sonst: PASS
              </code>
            </div>
          </>
        ) : (
          <>
            <Topology />
            {index === 10 ? (
              <div className="policy-summary">
                <strong>
                  Ingress-Regel: {lab.policy ? "aktiv" : "inaktiv"}
                </strong>
                <span>
                  {lab.policy
                    ? "Client A → erlaubt · Client B → blockiert"
                    : "Client A und Client B → erlaubt"}
                </span>
              </div>
            ) : (
              <div className="backend-summary">
                <span>Backend-Antworten</span>
                <strong>A: {lab.a}</strong>
                <strong>B: {lab.b}</strong>
              </div>
            )}
          </>
        )}
        <div className="packet-counters">
          <div>
            <span>{xdp ? "Pakete gesendet" : "Verbindungsversuche"}</span>
            <strong>{lab.sent}</strong>
          </div>
          <div>
            <span>{xdp ? "PASS" : "Erlaubt"}</span>
            <strong className="pass">{lab.pass}</strong>
          </div>
          <div>
            <span>{xdp ? "DROP" : "Blockiert"}</span>
            <strong className="drop">{lab.drop}</strong>
          </div>
        </div>
      </div>
      <div className="event-table">
        <h2>{xdp ? "Letzte Pakete" : "Letzte Versuche"}</h2>
        {lab.events.length ? (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{xdp ? "Port" : "Quelle"}</th>
                <th>Ergebnis</th>
              </tr>
            </thead>
            <tbody>
              {lab.events.slice(0, 4).map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>
                    {xdp
                      ? e.port
                      : e.client === "trusted"
                        ? "Client A"
                        : "Client B"}
                  </td>
                  <td className={e.action === "DROP" ? "drop" : "pass"}>
                    {e.action === "DROP"
                      ? "DROP"
                      : xdp
                        ? "PASS"
                        : `Backend ${e.backend?.toUpperCase()}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-events">
            Noch keine {xdp ? "Pakete" : "Verbindungen"}.<br />
            Über die Referentenansicht erzeugen.
          </p>
        )}
      </div>
    </div>
  );
}
function LabControls({
  mode,
  lab,
  updateLab,
  send,
  reset,
}: {
  mode: string;
  lab: Lab;
  updateLab: (p: Partial<Lab>) => void;
  send: (n: number) => void;
  reset: () => void;
}) {
  const xdp = mode === "xdp",
    active = xdp ? lab.filter : lab.policy;
  return (
    <section className="lab-controls" aria-label="Simulation steuern">
      <div>
        <label>
          {xdp ? "Zielport" : "Quelle"}
          <select
            aria-label={xdp ? "TCP-Zielport" : "Quelle"}
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
                <option value="9090">TCP / 9090</option>
                <option value="8080">TCP / 8080</option>
              </>
            ) : (
              <>
                <option value="trusted">Client A</option>
                <option value="guest">Client B</option>
              </>
            )}
          </select>
        </label>
        <button
          role="switch"
          aria-checked={active}
          className={`rule-switch ${active ? "active" : ""}`}
          onClick={() =>
            updateLab(xdp ? { filter: !lab.filter } : { policy: !lab.policy })
          }
        >
          <span>{active ? <Check size={15} /> : null}</span>
          {xdp ? "9090 sperren" : "Nur Client A erlauben"}
        </button>
      </div>
      <div>
        <button className="primary" onClick={() => send(1)}>
          <Play size={15} />
          {xdp ? "Paket senden" : "Verbinden"}
        </button>
        <button onClick={() => send(10)}>+10</button>
        <button aria-label="Simulation zurücksetzen" onClick={reset}>
          <RotateCcw size={17} />
        </button>
      </div>
    </section>
  );
}
