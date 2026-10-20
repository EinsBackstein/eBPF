import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, Copy, Terminal } from "lucide-react";
import files from "./code.generated.json";
import { useOutputScroll, type OutputScroll } from "./useOutputScroll";
import { jsonTokens } from "./json-output.mjs";
import { slides } from "./deck";
import { XdpOutput, type XdpEvidence } from "./Xdp";

type Source = keyof typeof files;
type Flow = {
  time: string;
  source: string;
  destination: string;
  verdict: string;
  dropReason: string | null;
  summary: string;
  sourceIdentity: number;
  destinationIdentity: number;
  raw: {
    source?: { labels?: string[] };
    destination?: { labels?: string[] };
    IP?: { source?: string; destination?: string };
    l4?: { TCP?: { source_port?: number; destination_port?: number } };
    traffic_direction?: string;
  };
};
export type LabRun = {
  experiment?: "xdp";
  xdp?: XdpEvidence | null;
  id: string;
  action: string;
  at: string;
  command: string;
  stdout: string;
  jsonOutput?: string | null;
  stderr: string;
  code: number | null;
  durationMs: number;
  flows: {
    events: Flow[];
    stderr: string;
    code: number | null;
    command: string;
  };
  logs: { stdout: string; stderr: string };
  resources: {
    items: Array<{
      kind: string;
      metadata: { name: string; labels?: Record<string, string> };
      spec?: unknown;
    }>;
  } | null;
};
export type LabState = {
  view: "split" | "source" | "terminal" | "flows" | "logs";
  source: Source;
  codeScroll: number;
  codeScrollX: number;
  outputScroll: OutputScroll;
  flowIndex: number;
  run: LabRun | null;
};
const views = [
  ["split", "Code + Ergebnis"],
  ["source", "Code"],
  ["flows", "Ereignisse"],
  ["logs", "Server-Log"],
  ["terminal", "Originalausgabe"],
];
export const labStep = (index: number) => slides[index]?.labStep ?? -1;
export const isXdpSlide = (index: number) => [9, 10].includes(labStep(index));
export const lessons: Record<
  number,
  { heading: string; actions: [string, string][] }
> = {
  9: {
    heading: "Das Programm zählt, was ankommt",
    actions: [
      ["xdp-clear", "Start · Sperre ausschalten"],
      ["xdp-8080", "1 · 8080 testen"],
      ["xdp-9090", "2 · 9090 testen"],
      ["xdp-status", "3 · Maps lesen"],
      ["xdp-reset-counters", "Paketzähler zurücksetzen"],
    ],
  },
  10: {
    heading: "Python ändert die Map, XDP entscheidet",
    actions: [
      ["xdp-block", "1 · 9090 in die Map"],
      ["xdp-9090", "2 · 9090 testen"],
      ["xdp-8080", "3 · 8080 als Kontrolle"],
      ["xdp-clear", "4 · Regel aufheben"],
      ["xdp-9090", "5 · 9090 wieder testen"],
      ["xdp-status", "Maps lesen"],
      ["xdp-reset-counters", "Paketzähler zurücksetzen"],
    ],
  },
  11: {
    heading: "Eine Adresse, zwei Backends",
    actions: [
      ["keepalive", "1 · 5 × Keep-alive"],
      ["new-connections", "2 · 10 neue Verbindungen"],
      ["request-a", "3 · Client A"],
      ["request-b", "4 · Client B"],
      ["lb-map", "5 · Tabelle im Kernel lesen"],
    ],
  },
  12: {
    heading: "Eine Gästeliste im Kernel",
    actions: [
      ["policy-open", "1 · Beide erlauben"],
      ["request-b", "2 · B testen"],
      ["policy-trusted", "3 · Nur A erlauben"],
      ["request-b", "4 · B erneut testen"],
      ["request-a", "5 · A als Kontrolle"],
      ["policy-open", "6 · Zurücksetzen"],
      ["request-b", "7 · B wieder testen"],
      ["policy-map", "Maps lesen"],
    ],
  },
};

export function CodeBlock({
  source,
  scroll = 0,
  scrollX = 0,
  fontSize = 18,
  onScroll,
}: {
  source: Source;
  scroll?: number;
  scrollX?: number;
  fontSize?: number;
  onScroll?: (position: number, horizontal: number) => void;
}) {
  const file = files[source];
  const viewport = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const appliedScroll = useRef({ top: 0, left: 0 });
  useLayoutEffect(() => {
    const box = viewport.current;
    if (!box) return;
    const apply = () => {
      const top = scroll * Math.max(0, box.scrollHeight - box.clientHeight);
      const left = scrollX * Math.max(0, box.scrollWidth - box.clientWidth);
      if (Math.abs(box.scrollTop - top) > 1) box.scrollTop = top;
      if (Math.abs(box.scrollLeft - left) > 1) box.scrollLeft = left;
      appliedScroll.current = { top: box.scrollTop, left: box.scrollLeft };
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(box);
    document.fonts.ready.then(apply);
    return () => observer.disconnect();
  }, [source, scroll, scrollX, fontSize]);
  return (
    <div className="cf-code">
      <div className="cf-code-title">
        <span>{file.path}</span>
        <span>
          {file.lang.toUpperCase()} · {file.lineCount} Zeilen
        </span>
        <button
          aria-label="Code kopieren"
          onClick={async () => {
            await navigator.clipboard.writeText(file.raw);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          <Copy size={18} />
          {copied ? "Kopiert" : ""}
        </button>
      </div>
      <div
        ref={viewport}
        className="numbered-code"
        style={{ fontSize }}
        data-source={source}
        data-code-scroll
        role="region"
        aria-label={`Quellcode ${file.path} – scrollbar`}
        tabIndex={0}
        onKeyDown={(event) => event.stopPropagation()}
        onScroll={(event) => {
          const box = event.currentTarget;
          if (Math.abs(box.scrollTop - appliedScroll.current.top) <= 1 &&
              Math.abs(box.scrollLeft - appliedScroll.current.left) <= 1) return;
          const range = box.scrollHeight - box.clientHeight;
          const ratio = Math.max(
            0,
            Math.min(1, range > 0 ? box.scrollTop / range : 0),
          );
          const horizontalRange = box.scrollWidth - box.clientWidth;
          const horizontal = Math.max(0, Math.min(1, horizontalRange > 0 ? box.scrollLeft / horizontalRange : 0));
          appliedScroll.current = { top: box.scrollTop, left: box.scrollLeft };
          if (Math.abs(ratio - scroll) > 0.001 || Math.abs(horizontal - scrollX) > 0.001)
            onScroll?.(ratio, horizontal);
        }}
        dangerouslySetInnerHTML={{ __html: file.html }}
      />
    </div>
  );
}

function Output({ run }: { run: LabRun | null }) {
  if (!run)
    return (
      <div className="lab-empty">
        <Terminal size={35} />
        <h2>Noch kein Befehl ausgeführt</h2>
        <p>
          Gleich werden Verbindungen aufgebaut und die Antworten verglichen.
        </p>
      </div>
    );
  const jsonRows = run.stdout
    .trim()
    .split("\n")
    .flatMap((line) => {
      try {
        const v = JSON.parse(line);
        return v.request ? [v] : [];
      } catch {
        return [];
      }
    });
  return (
    <div className="real-output" data-sync-scroll="result" data-code-scroll tabIndex={0} role="region" aria-label="Ergebnis">
      <div className="output-stamp">
        <span>{jsonRows.length ? "HTTP-Antworten" : "Ergebnis"}</span>
        <span>
          {new Date(run.at).toLocaleTimeString("de-AT")} · Exit{" "}
          {run.code ?? "—"}
        </span>
      </div>
      <pre className="run-command">$ {run.command}</pre>
      {jsonRows.length ? (
        <table className="response-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Antwort / Server</th>
              <th>Client-Socket</th>
            </tr>
          </thead>
          <tbody>
            {jsonRows.map((r, i) => (
              <tr key={i}>
                <td>{r.request}</td>
                <td>
                  {r.error ? (
                    <strong className="drop">{r.error}</strong>
                  ) : (
                    <>
                      <span className="http-status">{r.status}</span>{" "}
                      {r.backend}
                    </>
                  )}
                  <small>{r.request_id}</small>
                </td>
                <td>{r.client_socket || r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <pre className="stdout">{run.stdout || "Keine Ausgabe."}</pre>
      )}
      {run.stderr && <pre className="stderr">{run.stderr}</pre>}
    </div>
  );
}
export function LabSlide({
  index,
  state,
  onChange,
}: {
  index: number;
  state: LabState;
  onChange?: (patch: Partial<LabState>) => void;
}) {
  const run =
      state.run?.experiment === "xdp"
        ? isXdpSlide(index)
          ? state.run
          : null
        : isXdpSlide(index)
          ? null
          : state.run;
  const flows = run?.flows.events || [],
    flow = flows[Math.min(state.flowIndex, flows.length - 1)];
  const workspace = useRef<HTMLDivElement>(null);
  useOutputScroll(workspace, state.outputScroll,
    `${state.view}:${run?.id || "empty"}:${state.flowIndex}`,
    onChange ? (outputScroll) => onChange({ outputScroll }) : undefined);
  return (
    <div ref={workspace} className={`lab-workspace view-${state.view}`}>
      <div className="lab-heading">
        <div>
          {views
            .filter(
              ([v]) =>
                !isXdpSlide(index) ||
                ["split", "source", "terminal"].includes(v),
            )
            .map(([v, l]) => (
              <button key={v} type="button" aria-pressed={state.view === v}
                className={state.view === v ? "active" : ""}
                onClick={() => onChange?.({ view: v as LabState["view"] })}>
                {l}
              </button>
            ))}
        </div>
      </div>
      {state.view === "split" && (
        <div className="lab-split">
          <div>
            <CodeBlock
              source={state.source}
              scroll={state.codeScroll}
              scrollX={state.codeScrollX}
              fontSize={18}
              onScroll={
                onChange ? (codeScroll, codeScrollX) => onChange({ codeScroll, codeScrollX }) : undefined
              }
            />
          </div>
          {isXdpSlide(index) ? (
            <XdpOutput evidence={run?.xdp} stderr={run?.stderr} at={run?.at} />
          ) : (
            <Output run={run} />
          )}
        </div>
      )}
      {state.view === "source" && (
        <div className="code-large">
          <CodeBlock
            source={state.source}
            scroll={state.codeScroll}
              scrollX={state.codeScrollX}
              fontSize={24}
            onScroll={
              onChange ? (codeScroll, codeScrollX) => onChange({ codeScroll, codeScrollX }) : undefined
            }
          />
        </div>
      )}
      {state.view === "terminal" && (
        <div className="log-evidence" data-sync-scroll="terminal" data-code-scroll tabIndex={0} role="region" aria-label="Originalausgabe">
          <div className="output-stamp">
            <span>{run?.jsonOutput ? "JSON · jq ." : "Originalausgabe"}</span>
            <span>
              {run ? new Date(run.at).toLocaleTimeString("de-AT") : "—"}
            </span>
          </div>
          <pre className="run-command">
            $ {run?.command || "Noch kein Befehl ausgeführt."}
          </pre>
          {run?.jsonOutput ? <pre className="stdout json-output"><code>{jsonTokens(run.jsonOutput).map((token, i) =>
            <span key={i} className={`json-${token.kind}`}>{token.value}</span>
          )}</code></pre> : <pre className="stdout">{run?.stdout || "Noch keine Ausgabe."}</pre>}
          {run?.stderr && <pre className="stderr">{run.stderr}</pre>}
        </div>
      )}
      {state.view === "flows" && (
        <div className="flow-evidence">
          <div data-sync-scroll="flowList" data-code-scroll tabIndex={0} role="region" aria-label="Netzwerkereignisse">
            <h2>Netzwerkereignisse</h2>
            <p>Von Hubble erfasst. Verworfene Pakete zuerst.</p>
            <table>
              <thead>
                <tr>
                  <th>Zeit</th>
                  <th>Quelle → Ziel</th>
                  <th>Entscheidung</th>
                </tr>
              </thead>
              <tbody>
                {flows.slice(0, 12).map((f, i) => (
                  <tr
                    key={i}
                    className={i === state.flowIndex ? "selected" : ""}
                  >
                    <td>{f.time?.slice(11, 23)}</td>
                    <td>
                      {f.source} → {f.destination}
                    </td>
                    <td className={f.verdict === "DROPPED" ? "drop" : ""}>
                      {f.verdict}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!flows.length && <p>{run ? "Keine Netzwerkereignisse erfasst." : "Noch keine Anfrage ausgeführt."}</p>}
            {run && run.flows.code !== 0 && (
              <p className="stderr">
                Ereignisabfrage: {run?.flows.stderr || "Noch keine Abfrage."}
              </p>
            )}
          </div>
          <div data-sync-scroll="flowDetails" data-code-scroll tabIndex={0} role="region" aria-label="Ereignisdetails">
            <h2>{flow?.dropReason || "Ereignisdetails"}</h2>
            {flow && (
              <dl className="flow-facts">
                <dt>Quelle</dt>
                <dd>
                  {flow.source} · Identität {flow.sourceIdentity}
                  <small>
                    {flow.raw.source?.labels
                      ?.filter((l) => l.startsWith("k8s:role="))
                      .join(" ")}
                  </small>
                </dd>
                <dt>Ziel</dt>
                <dd>
                  {flow.destination} · TCP/{flow.raw.l4?.TCP?.destination_port}
                </dd>
                <dt>Entscheidung</dt>
                <dd className={flow.verdict === "DROPPED" ? "drop" : ""}>
                  {flow.verdict} · {flow.raw.traffic_direction}
                </dd>
                <dt>Verbindung</dt>
                <dd>
                  {flow.raw.IP?.source}:{flow.raw.l4?.TCP?.source_port} →{" "}
                  {flow.raw.IP?.destination}
                </dd>
              </dl>
            )}
            <p>Erfasstes Ereignis als JSON</p>
            <pre className="flow-json" data-sync-scroll="flowJson" data-code-scroll tabIndex={0} aria-label="Ereignis-JSON">
              {flow
                ? JSON.stringify(flow.raw, null, 2)
                : "Noch kein Ereignis erfasst."}
            </pre>
          </div>
        </div>
      )}
      {state.view === "logs" && (
        <div className="log-evidence" data-sync-scroll="logs" data-code-scroll tabIndex={0} role="region" aria-label="Server-Log">
          <h2>Server-Log</h2>
          <p>HTTP-Anfragen mit Request-ID und antwortendem Server.</p>
          <pre className="stdout">
            {run?.logs.stdout || "Noch keine Log-Einträge erfasst."}
          </pre>
          {run?.logs.stderr && <pre className="stderr">{run.logs.stderr}</pre>}
        </div>
      )}
    </div>
  );
}
export function LabControls({
  index,
  state,
  onChange,
}: {
  index: number;
  state: LabState;
  onChange: (patch: Partial<LabState>) => void;
}) {
  const [status, setStatus] = useState("Verbindung zum Labor prüfen …"),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<LabRun[]>(
    state.run ? [state.run] : [],
  );
  useEffect(() => {
    let live = true;
    const check = () =>
      fetch("/api/lab/status")
        .then(async (r) => {
          if (!r.ok) throw new Error();
          const v = await r.json();
          if (live) {
            const connected = isXdpSlide(index) ? v.xdpReady : v.ready;
            setReady(connected);
            setStatus(
              connected
                ? isXdpSlide(index)
                  ? "XDP-Testnetz verbunden"
                  : "Linux-Labor verbunden"
                : isXdpSlide(index)
                  ? "XDP fehlt · npm run lab:xdp:setup"
                  : "Lab-Pods noch nicht bereit",
            );
          }
        })
        .catch(() => {
          if (live) {
            setReady(false);
            setStatus("Labor offline · npm run lab");
          }
        });
    check();
    const timer = setInterval(check, 15000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [index]);
  async function execute(action: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/lab/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const value = await response.json();
      if (!response.ok)
        throw new Error(value.error || "Lab-Befehl fehlgeschlagen");
      setHistory((h) => [value, ...h].slice(0, 20));
      onChange({
        run: value,
        flowIndex: 0,
        outputScroll: {},
      });
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="lab-controls" aria-label="Linux-Labor steuern">
      <div className="lab-controls-row">
        <span className={ready ? "lab-connected" : "lab-disconnected"}>
          {busy ? "Befehl läuft …" : status}
        </span>
        <label>
          Ansicht{" "}
          <select
            aria-label="Laboransicht"
            value={state.view}
            onChange={(e) =>
              onChange({ view: e.target.value as LabState["view"] })
            }
          >
            <option value="split">Code + Ergebnis</option>
            <option value="source">Code groß</option>
            <option value="terminal">Originalausgabe</option>
            {!isXdpSlide(index) && (
              <>
                <option value="flows">Ereignisse</option>
                <option value="logs">Server-Log</option>
              </>
            )}
          </select>
        </label>
      </div>
      <div className="lab-controls-row">
        <label>
          Code{" "}
          <select
            aria-label="Quelldatei"
            value={state.source}
            onChange={(e) =>
              onChange({ source: e.target.value as Source, codeScroll: 0, codeScrollX: 0 })
            }
          >
            {Object.entries(files)
              .filter(([id]) => id.startsWith("xdp") === isXdpSlide(index))
              .map(([id, f]) => (
                <option key={id} value={id}>
                  {f.path.split("/").pop()}
                </option>
              ))}
          </select>
        </label>
        <button
          aria-label="Code nach oben scrollen"
          disabled={state.codeScroll <= 0}
          onClick={() =>
            onChange({ codeScroll: Math.max(0, state.codeScroll - 0.2) })
          }
        >
          <ChevronUp size={16} />
        </button>
        <span>Code {Math.round(state.codeScroll * 100)} %</span>
        <button
          aria-label="Code nach unten scrollen"
          disabled={state.codeScroll >= 1}
          onClick={() =>
            onChange({ codeScroll: Math.min(1, state.codeScroll + 0.2) })
          }
        >
          <ChevronDown size={16} />
        </button>
        {state.view === "flows" && (
          <label>
            Flow{" "}
            <select
              aria-label="Flow auswählen"
              value={state.flowIndex}
              onChange={(e) => onChange({ flowIndex: Number(e.target.value), outputScroll: { ...state.outputScroll, flowDetails: { x: 0, y: 0 }, flowJson: { x: 0, y: 0 } } })}
            >
              {(state.run?.flows.events || []).slice(0, 12).map((f, i) => (
                <option key={i} value={i}>
                  {i + 1} · {f.verdict} · {f.source}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {history.some(
        (r) => (r.experiment === "xdp") === isXdpSlide(index),
      ) && (
        <div className="lab-controls-row">
          <label>
            Messung{" "}
            <select
              aria-label="Erfasste Messung"
              value={state.run?.id || ""}
              onChange={(e) => {
                const run = history.find((r) => r.id === e.target.value);
                if (run) onChange({ run, flowIndex: 0, outputScroll: {} });
              }}
            >
              {history
                .filter(
                  (r) => (r.experiment === "xdp") === isXdpSlide(index),
                )
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {new Date(r.at).toLocaleTimeString("de-AT")} · {r.action} ·
                    Exit {r.code}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}
      <div className="lab-action-list">
        {lessons[labStep(index)].actions.map(([id, label], i) => (
          <button
            key={id + i}
            disabled={!ready || busy}
            onClick={() => execute(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
