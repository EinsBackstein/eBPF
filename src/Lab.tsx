import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Terminal,
} from "lucide-react";
import files from "./code.generated.json";

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
  id: string;
  action: string;
  at: string;
  command: string;
  stdout: string;
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
  view: "split" | "source" | "terminal" | "hubble" | "flows" | "logs";
  source: Source;
  page: number;
  flowIndex: number;
  run: LabRun | null;
};
export const lessons: Record<
  number,
  { heading: string; why: string; read: string; actions: [string, string][] }
> = {
  8: {
    heading: "Eine Anfrage bis zum antwortenden Pod verfolgen",
    why: "Der Server schreibt Podname, Request-ID und seine TCP-Gegenstelle in die Antwort. Diese Werte verbinden Clientausgabe und Backend-Log. Hubble zeigt zusätzlich, welche Endpoints kommunizieren.",
    read: "server.py · Zeilen 11–13: Genau diese Felder erscheinen in der Antwort.",
    actions: [
      ["request-a", "Client A anfragen"],
      ["request-b", "Client B anfragen"],
      ["backend-logs", "Logs lesen"],
    ],
  },
  9: {
    heading: "HTTP-Anfrage ≠ neue TCP-Verbindung",
    why: "Im Keep-alive-Modus bleibt HTTPConnection bestehen. Im Modus new wird sie nach jeder Antwort geschlossen. Vergleiche die Backend-Namen. Die Gegenstelle am Server gehört wegen der L7-Regel zu Envoy; sie zählt keine Client-Verbindungen. Eine 50:50-Verteilung ist nicht garantiert.",
    read: "client.py · Zeilen 13–19 und 28–31: Verbindung weiterverwenden oder schließen.",
    actions: [
      ["keepalive", "5 × Keep-alive"],
      ["new-connections", "10 × neue Verbindung"],
      ["lb-map", "BPF-LB-Map lesen"],
    ],
  },
  10: {
    heading: "Eine Label-Regel ändern, die Wirkung nachweisen",
    why: "web-access gilt für app=web. Mit role: trusted passt Client A; Client B trägt role=guest. Sein TCP-Aufbau wird verworfen, bevor HTTP verarbeitet wird. Daher Timeout statt HTTP 403.",
    read: "policy-trusted.yaml · Zeile 14: Diese zusätzliche Bedingung schließt Client B aus.",
    actions: [
      ["policy-open", "1 · Beide erlauben"],
      ["request-b", "2 · B testen"],
      ["policy-trusted", "3 · Nur A erlauben"],
      ["request-b", "4 · B erneut testen"],
      ["request-a", "5 · A als Kontrolle"],
      ["policy-open", "6 · Zurücksetzen"],
      ["request-b", "7 · B wieder testen"],
    ],
  },
  11: {
    heading: "Vom Kubernetes-Objekt zur BPF-Map",
    why: "Die Service-Map enthält Frontend und Backend-Adressen. Endpoint-Identitäten verbinden Pod-Labels mit den Einträgen der Policy-Maps. Das ist Kernelzustand des Labs, keine aus dem YAML gezeichnete Grafik.",
    read: "Die Ausgabe kommt direkt aus cilium-dbg im Cilium-Agenten.",
    actions: [
      ["resources", "Pods / Service"],
      ["endpoints", "Endpoint-Identitäten"],
      ["lb-map", "Service-Map"],
      ["policy-map", "Policy-Maps"],
    ],
  },
};

export function CodeBlock({
  source,
  page = 0,
}: {
  source: Source;
  page?: number;
}) {
  const file = files[source],
    part = file.pages[Math.min(page, file.pages.length - 1)];
  const [copied, setCopied] = useState(false);
  return (
    <div className="cf-code">
      <div className="cf-code-title">
        <span>{file.path}</span>
        <span>
          {file.lang.toUpperCase()} · {part.first}–{part.last}
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
        className="numbered-code"
        data-source={source}
        style={{ counterReset: `line ${part.first - 1}` }}
        dangerouslySetInnerHTML={{ __html: part.html }}
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
          Die Bedienelemente unter der Folie führen den sichtbaren Befehl im
          Linux-Labor aus.
        </p>
        <p>Ausgabe und Hubble-Ereignisse werden hier zusammen angezeigt.</p>
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
    <div className="real-output">
      <div className="output-stamp">
        <span>LINUX-AUSGABE</span>
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
              <th>Ergebnis / Backend</th>
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
        <pre className="stdout">{run.stdout || "(keine Standardausgabe)"}</pre>
      )}
      {run.stderr && <pre className="stderr">{run.stderr}</pre>}
    </div>
  );
}
export function LabSlide({ index, state }: { index: number; state: LabState }) {
  const lesson = lessons[index],
    run = state.run;
  const flows = run?.flows.events || [],
    flow = flows[Math.min(state.flowIndex, flows.length - 1)];
  let explanation = lesson.why;
  if (index === 10 && run?.resources) {
    const policy = run.resources.items.find(
      (r) =>
        r.kind === "CiliumNetworkPolicy" && r.metadata.name === "web-access",
    );
    const spec = policy?.spec as
      | {
          ingress?: {
            fromEndpoints?: { matchLabels?: Record<string, string> }[];
          }[];
        }
      | undefined;
    const restricted = spec?.ingress?.some((rule) =>
      rule.fromEndpoints?.some(
        (endpoint) => endpoint.matchLabels?.role === "trusted",
      ),
    );
    if (spec)
      explanation = restricted
        ? "Regel dieser Messung: role=trusted ist erforderlich. Client A passt; Client B trägt role=guest. Sein TCP-Aufbau wird vor HTTP verworfen. POLICY_DENIED erklärt den Timeout; der Webserver liefert keinen HTTP-403-Status."
        : "Regel dieser Messung: component=client genügt. A und B passen beide und dürfen TCP/8080 mit GET / erreichen. Die erfolgreiche Antwort nach dem Zurücksetzen belegt die Wiederherstellung; die HTTP-Regel aktiviert zusätzlich Envoy.";
  }
  if (
    index === 9 &&
    run &&
    ["keepalive", "new-connections"].includes(run.action)
  ) {
    const rows = run.stdout
      .trim()
      .split("\n")
      .flatMap((line) => {
        try {
          const row = JSON.parse(line);
          return row.status === 200 ? [row] : [];
        } catch {
          return [];
        }
      });
    if (rows.length)
      explanation = `Gemessen: ${rows.length} HTTP-Antworten, ${new Set(rows.map((r) => r.client_socket)).size} Client-Socket(s), ${new Set(rows.map((r) => r.backend)).size} Backend(s). ${run.action === "keepalive" ? "HTTPConnection bleibt bestehen." : "Der Client schließt die Verbindung nach jeder Antwort."} Neue Verbindungen ermöglichen eine neue Backend-Auswahl; eine 50:50-Quote ist nicht garantiert.`;
  }
  return (
    <div className={`lab-workspace view-${state.view}`}>
      <div className="lab-heading">
        <span>k3d-ebpf-talk / ebpf-talk</span>
        <div>
          {[
            ["split", "Code + Ergebnis"],
            ["source", "Code"],
            ["hubble", "Hubble UI"],
            ["flows", "Flowdetails"],
            ["logs", "Backend-Logs"],
            ["terminal", "Originalausgabe"],
          ].map(([v, l]) => (
            <span key={v} className={state.view === v ? "active" : ""}>
              {l}
            </span>
          ))}
        </div>
      </div>
      {state.view === "split" && (
        <div className="lab-split">
          <div>
            <CodeBlock source={state.source} page={state.page} />
            <p className="code-reading">{lesson.read}</p>
          </div>
          <Output run={run} />
        </div>
      )}
      {state.view === "source" && (
        <div className="code-large">
          <CodeBlock source={state.source} page={state.page} />
          <p className="code-reading">{lesson.read}</p>
        </div>
      )}
      {state.view === "terminal" && (
        <div className="log-evidence">
          <div className="output-stamp">
            <span>ORIGINALE STANDARD-AUSGABE</span>
            <span>
              {run ? new Date(run.at).toLocaleTimeString("de-AT") : "—"}
            </span>
          </div>
          <pre className="run-command">
            $ {run?.command || "Zuerst einen Befehl ausführen."}
          </pre>
          <pre className="stdout">{run?.stdout || "Noch keine Ausgabe."}</pre>
          {run?.stderr && <pre className="stderr">{run.stderr}</pre>}
        </div>
      )}
      {state.view === "hubble" && (
        <div className="hubble-live">
          <iframe
            src="http://127.0.0.1:12000/?namespace=ebpf-talk"
            title="Echte Hubble UI · Namespace ebpf-talk"
          />
          <a
            href="http://127.0.0.1:12000/?namespace=ebpf-talk"
            target="_blank"
            rel="noreferrer"
          >
            Hubble UI separat öffnen <ExternalLink size={17} />
          </a>
        </div>
      )}
      {state.view === "flows" && (
        <div className="flow-evidence">
          <div>
            <h2>Hubble: Drops und HTTP zuerst</h2>
            <p>{run?.flows.command || "Zuerst eine Anfrage ausführen."}</p>
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
            {run?.flows.code !== 0 && (
              <p className="stderr">
                Hubble: {run?.flows.stderr || "Noch keine Abfrage."}
              </p>
            )}
          </div>
          <div>
            <h2>{flow?.dropReason || "Originales Flow-JSON"}</h2>
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
            <p>Originales Hubble-JSON</p>
            <pre className="flow-json">
              {flow
                ? JSON.stringify(flow.raw, null, 2)
                : "Noch keine Ereignisse erfasst. Prüfe Hubble Relay und führe eine Anfrage aus."}
            </pre>
          </div>
        </div>
      )}
      {state.view === "logs" && (
        <div className="log-evidence">
          <h2>Request-ID in der Serverausgabe wiederfinden</h2>
          <p>
            Die ID aus der HTTP-Antwort muss im Backend-Log stehen. Ein
            verworfener TCP-Aufbau erzeugt keinen HTTP-Request im Webserver.
          </p>
          <pre className="stdout">
            {run?.logs.stdout || "Noch keine Backend-Logs erfasst."}
          </pre>
        </div>
      )}
      <div className="lab-explanation">
        <strong>Warum passiert das?</strong>
        <p>{explanation}</p>
      </div>
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
            setReady(v.ready);
            setStatus(
              v.ready ? "Linux-Labor verbunden" : "Lab-Pods noch nicht bereit",
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
  }, []);
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
        view: state.view === "hubble" ? "hubble" : "split",
        flowIndex: 0,
        ...(action === "policy-open"
          ? { source: "open" as Source, page: 1 }
          : action === "policy-trusted"
            ? { source: "trusted" as Source, page: 1 }
            : {}),
      });
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const file = files[state.source];
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
            <option value="hubble">Hubble UI (live)</option>
            <option value="flows">Flowdetails</option>
            <option value="logs">Backend-Logs</option>
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
              onChange({ source: e.target.value as Source, page: 0 })
            }
          >
            {Object.entries(files).map(([id, f]) => (
              <option key={id} value={id}>
                {f.path.split("/").pop()}
              </option>
            ))}
          </select>
        </label>
        <button
          aria-label="Vorherige Codeseite"
          disabled={state.page === 0}
          onClick={() => onChange({ page: state.page - 1 })}
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          {Math.min(state.page + 1, file.pages.length)}/{file.pages.length}
        </span>
        <button
          aria-label="Nächste Codeseite"
          disabled={state.page >= file.pages.length - 1}
          onClick={() => onChange({ page: state.page + 1 })}
        >
          <ChevronRight size={16} />
        </button>
        {state.view === "flows" && (
          <label>
            Flow{" "}
            <select
              aria-label="Flow auswählen"
              value={state.flowIndex}
              onChange={(e) => onChange({ flowIndex: Number(e.target.value) })}
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
      {history.length > 0 && (
        <div className="lab-controls-row">
          <label>
            Messung{" "}
            <select
              aria-label="Erfasste Messung"
              value={state.run?.id || ""}
              onChange={(e) => {
                const run = history.find((r) => r.id === e.target.value);
                if (run) onChange({ run, flowIndex: 0 });
              }}
            >
              {history.map((r) => (
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
        {lessons[index].actions.map(([id, label], i) => (
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
