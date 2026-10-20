import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
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
import { initialLab, readPresentation } from "./presentation-model.mjs";
import { LabControls, type LabState } from "./Lab";
import { SlideContent } from "./Slides";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./styles.css";
import "./reference-design.css";

type Snapshot = {
  index: number;
  black: boolean;
  lab: LabState;
  answers: number[];
};
const KEY = "ebpf-deck-v5";
// Migrate earlier presentation state and retain locally edited notes.
try {
  if (!localStorage.getItem(KEY) && localStorage.getItem("ebpf-deck-v4")) {
    localStorage.setItem(
      KEY,
      JSON.stringify(
        readPresentation(
          JSON.parse(localStorage.getItem("ebpf-deck-v4")!),
          slides.length,
        ),
      ),
    );
  }
  if (!localStorage.getItem(KEY) && localStorage.getItem("ebpf-deck-v3")) {
    try {
      const old = JSON.parse(localStorage.getItem("ebpf-deck-v3")!);
      if (old.index >= 12) old.index += 1;
      localStorage.setItem(KEY, JSON.stringify(old));
    } catch {
      /* Ignore corrupt old state. */
    }
  }
  if (!localStorage.getItem("ebpf-notes-xdp-migrated")) {
    try {
      const notes = JSON.parse(localStorage.getItem("ebpf-notes") || "{}");
      for (const i of [14, 13, 12]) {
        if (typeof notes[i] === "string") notes[i + 1] = notes[i];
        delete notes[i];
      }
      localStorage.setItem("ebpf-notes", JSON.stringify(notes));
      localStorage.setItem("ebpf-notes-xdp-migrated", "true");
    } catch {
      /* Storage may be unavailable. */
    }
  }
} catch {
  /* Storage may be unavailable. */
}
try {
  if (!localStorage.getItem("ebpf-notes-basics-v5")) {
    const saved = JSON.parse(localStorage.getItem("ebpf-notes") || "{}");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      localStorage.setItem(
        "ebpf-notes-before-basics-v5",
        JSON.stringify(saved),
      );
      const next = { ...saved };
      delete next[2];
      delete next[4];
      delete next[5];
      if (typeof saved[5] === "string") next[2] = saved[5];
      if (typeof saved[4] === "string") next[5] = saved[4];
      localStorage.setItem("ebpf-notes", JSON.stringify(next));
    }
    localStorage.setItem("ebpf-notes-basics-v5", "true");
  }
} catch {
  /* Storage may be unavailable. */
}
const audience =
  new URLSearchParams(location.search).get("view") === "audience";
function stored(): Snapshot {
  try {
    return (
      (readPresentation(
        JSON.parse(localStorage.getItem(KEY) || "null"),
        slides.length,
      ) as Snapshot) || {
        index: 0,
        black: false,
        lab: initialLab() as LabState,
        answers: [],
      }
    );
  } catch {
    return {
      index: 0,
      black: false,
      lab: initialLab() as LabState,
      answers: [],
    };
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
  const controller = useRef(crypto.randomUUID());
  const ownsControl = () => {
    try {
      return localStorage.getItem(KEY + "-controller") === controller.current;
    } catch {
      return true;
    }
  };
  const claimControl = () => {
    try {
      localStorage.setItem(KEY + "-controller", controller.current);
    } catch {
      /* BroadcastChannel still works */
    }
  };
  const mutate = (update: (s: Snapshot) => Snapshot) => {
    claimControl();
    setState(update);
  };
  const current = useRef(state);
  current.current = state;
  const lastAudience = useRef(0);
  const origin = useRef(0);
  const elapsed = useRef(0);
  const slide = slides[state.index];
  const speak =
    typeof customNotes[state.index] === "string"
      ? customNotes[state.index]
      : slide.notes;
  useEffect(() => {
    if (!audience) {
      try {
        if (!localStorage.getItem(KEY + "-controller")) claimControl();
      } catch {
        /* no persistent storage */
      }
    }
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
        if (m.type === "hello" && !audience && ownsControl()) {
          lastAudience.current = Date.now();
          setConnected(true);
          bus?.postMessage({ type: "state", value: current.current });
        }
        if (m.type === "state" && audience) {
          const next = readPresentation(m.value, slides.length);
          if (next) setState(next as Snapshot);
        }
      };
    const storage = (e: StorageEvent) => {
      if (audience && e.key === KEY) {
        try {
          const next = readPresentation(
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
      else
        setConnected(ownsControl() && Date.now() - lastAudience.current < 6500);
    }, 2000);
    return () => {
      clearInterval(heartbeat);
      bus?.close();
      channel.current = null;
      window.removeEventListener("storage", storage);
    };
  }, []);
  useEffect(() => {
    if (!audience && ownsControl()) {
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
    mutate((s) => ({
      ...s,
      index,
      black: false,
      lab:
        s.index !== index
          ? {
              ...s.lab,
              view: "split",
              source:
                index === 9
                  ? "client"
                  : index === 10
                    ? "trusted"
                    : index === 12
                      ? "xdpControl"
                      : index === 11
                        ? "workloads"
                        : "server",
              codeScroll: 0,
              run: (s.index === 12) !== (index === 12) ? null : s.lab.run,
            }
          : s.lab,
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
          "input,textarea,select,[contenteditable],[data-code-scroll]",
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
        mutate((s) => ({ ...s, black: !s.black }));
      if (e.key === "?") setModal("help");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [modal]);
  function openAudience() {
    claimControl();
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
      sources.map(([s, u]) => `- [${s}](${u})`).join("\n") +
      "\n\n## Gestaltung und Grafiken\n\nOriginalgrafiken: Cilium Authors (Apache-2.0). Organisationslogos und Kartenlayout: eBPF.io authors, https://ebpf.io/ (CC BY 4.0), für diese Präsentation mit deutschen Kurztexten und vergrößerten Maßen angepasst. Gestaltung technischer Folien nach Cloudflare Docs (CC BY 4.0). Markenrechte verbleiben bei den jeweiligen Organisationen. Vollständige Hinweise: https://github.com/EinsBackstein/eBPF/blob/main/public/vendor/ATTRIBUTION.md\n";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([content], { type: "text/markdown;charset=utf-8" }),
    );
    link.download = "eBPF-Handout.md";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  const toggleAnswer = (i: number) =>
    mutate((s) => ({
      ...s,
      answers: s.answers.includes(i)
        ? s.answers.filter((v) => v !== i)
        : [...s.answers, i],
    }));
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const deck = (
    <SlideContent
      index={state.index}
      lab={state.lab}
      answers={state.answers}
      onLabChange={
        audience
          ? undefined
          : (patch) => mutate((s) => ({ ...s, lab: { ...s.lab, ...patch } }))
      }
    />
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
          <button aria-label="Folien" onClick={() => setModal("overview")}>
            <Grid2X2 size={17} />
            <span>Folien</span>
          </button>
          <button
            aria-label="Sprechtext"
            aria-pressed={notes}
            onClick={() => setNotes((v) => !v)}
          >
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
              index={state.index}
              state={state.lab}
              onChange={(patch) =>
                mutate((s) => ({ ...s, lab: { ...s.lab, ...patch } }))
              }
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
                <strong className={seconds >= 1500 ? "overtime" : ""}>
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
          onClick={() => mutate((s) => ({ ...s, black: !s.black }))}
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
                    {s.kind === "lab" && <small>Linux-Labor</small>}
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
                In den Praxisfolien werden Versuche ausgewählt, Vorhersagen
                festgehalten und Abläufe schrittweise gezeigt oder abgespielt.
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
                Ursprung öffnen. Das Linux-Labor läuft separat in Docker; npm
                run lab verbindet die Website damit.
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
        (e.target as HTMLElement).closest(
          "input,textarea,select,[data-code-scroll]",
        ) ||
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
