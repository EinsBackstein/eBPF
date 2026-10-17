import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  buildTrace,
  caseFor,
  experimentFor,
  questionFor,
  outcome,
} from "./experiment-model.mjs";
export type ExperimentState = {
  caseIndex: number;
  step: number;
  prediction: number | null;
  completed: number[];
};
export function ExperimentControls({
  index,
  state,
  playing,
  choose,
  move,
  predict,
  togglePlay,
}: {
  index: number;
  state: ExperimentState;
  playing: boolean;
  choose: (n: number) => void;
  move: (n: number) => void;
  predict: (n: number) => void;
  togglePlay: () => void;
}) {
  const experiment = experimentFor(index),
    trace = buildTrace(caseFor(index, state.caseIndex));
  return (
    <section className="experiment-controls" aria-label="Experiment steuern">
      <div className="experiment-control-top">
        <label>
          Versuch
          <select
            aria-label="Versuch auswählen"
            value={state.caseIndex}
            onChange={(e) => choose(Number(e.target.value))}
          >
            {experiment.cases.map((c, i) => (
              <option key={c.title} value={i}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <span>
          Schritt {state.step + 1} / {trace.length}
        </span>
        <button
          aria-label="Experiment zurücksetzen"
          onClick={() => choose(state.caseIndex)}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="experiment-control-bottom">
        {state.step === 0 ? (
          <div className="predict-controls">
            <span>Vorhersage</span>
            <button
              aria-pressed={state.prediction === 0}
              onClick={() => predict(0)}
            >
              A
            </button>
            <button
              aria-pressed={state.prediction === 1}
              onClick={() => predict(1)}
            >
              B
            </button>
          </div>
        ) : (
          <button
            onClick={() => move(-1)}
            aria-label="Vorheriger Experimentschritt"
          >
            <ChevronLeft size={18} />
            Zurück
          </button>
        )}
        <div>
          <button
            className="play-experiment"
            disabled={state.step >= trace.length - 1}
            aria-label={playing ? "Ablauf pausieren" : "Ablauf abspielen"}
            onClick={togglePlay}
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          {state.step >= trace.length - 1 &&
          state.caseIndex < experiment.cases.length - 1 ? (
            <button
              className="primary"
              onClick={() => choose(state.caseIndex + 1)}
            >
              Nächster Versuch
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="primary"
              disabled={state.step >= trace.length - 1}
              onClick={() => move(1)}
            >
              Nächster Schritt
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
export function ExperimentSlide({
  index,
  state,
}: {
  index: number;
  state: ExperimentState;
}) {
  const experiment = experimentFor(index),
    c = caseFor(index, state.caseIndex),
    trace = buildTrace(c),
    frame = trace[state.step],
    question = questionFor(c),
    last = state.step === trace.length - 1;
  const isXdp = c.kind === "xdp",
    isBalance = c.kind === "balance",
    dropped = frame.verdict === "DROP";
  return (
    <div className={`experiment theme-${experiment.color}`}>
      <div className="experiment-top">
        <span className="experiment-badge">
          <i /> {experiment.name}
        </span>
        <span className="experiment-case">{c.title}</span>
        <span className="model-label">Erklärmodell · simuliert</span>
      </div>
      <div className="experiment-step-heading">
        <span>{String(state.step + 1).padStart(2, "0")}</span>
        <div>
          <h2>{frame.title}</h2>
          <p>{frame.explanation}</p>
        </div>
      </div>
      <div className="experiment-workspace">
        <div className="experiment-scene">
          <NetworkScene
            key={`${index}-${state.caseIndex}-${state.step}`}
            xdp={isXdp}
            client={c.client}
            port={c.port}
            stage={frame.stage}
            verdict={frame.verdict}
            backend={frame.requests.at(-1)?.backend || "a"}
            hook={experiment.hook}
          />
          {state.step === 0 ? (
            <div className="prediction-options">
              {question.options.map((option, i) => (
                <div
                  className={state.prediction === i ? "picked" : ""}
                  key={option}
                >
                  <b>{i === 0 ? "A" : "B"}</b>
                  <span>{option}</span>
                  {state.prediction === i && <small>Vorhersage</small>}
                </div>
              ))}
            </div>
          ) : isBalance ? (
            <div className="balance-evidence">
              <div className="evidence-metrics">
                <span>
                  <b>{frame.requests.length}</b>{" "}
                  {frame.requests.length === 1
                    ? "HTTP-Anfrage"
                    : "HTTP-Anfragen"}
                </span>
                <span>
                  <b>{new Set(frame.requests.map((r) => r.connection)).size}</b>{" "}
                  {new Set(frame.requests.map((r) => r.connection)).size === 1
                    ? "TCP-Verbindung"
                    : "TCP-Verbindungen"}
                </span>
                <span>
                  <b>{new Set(frame.requests.map((r) => r.backend)).size}</b>{" "}
                  {new Set(frame.requests.map((r) => r.backend)).size === 1
                    ? "Backend"
                    : "Backends"}
                </span>
              </div>
              <div className="connection-trail">
                {frame.requests.map((r) => (
                  <div key={r.request}>
                    <span>req-{r.request}</span>
                    <code>conn-0{r.connection}</code>
                    <b
                      className={r.backend === "a" ? "backend-a" : "backend-b"}
                    >
                      → {r.backend.toUpperCase()}
                    </b>
                  </div>
                ))}
              </div>
              <p>
                Beispielauswahl · Die Backend-Zuordnung gehört zur
                TCP-Verbindung.
              </p>
            </div>
          ) : (
            <div className={`trace-caption ${dropped ? "stopped" : ""}`}>
              <div>
                <span>{isXdp ? "Paket" : "Verbindung"}</span>
                <strong>
                  {isXdp
                    ? `TCP/${c.port}`
                    : c.client === "trusted"
                      ? "Client A → web:8080"
                      : "Client B → web:8080"}
                </strong>
              </div>
              <div>
                <span>Entscheidung</span>
                <strong
                  className={dropped ? "drop" : frame.verdict ? "pass" : ""}
                >
                  {frame.verdict || "noch offen"}
                </strong>
              </div>
              <div>
                <span>{isXdp ? "Map-Zähler Δ" : "Antwort"}</span>
                <strong>
                  {isXdp
                    ? frame.verdict
                      ? `${frame.verdict} +1`
                      : "0"
                    : frame.appReached
                      ? "HTTP 200 · backend-a"
                      : dropped
                        ? "kein HTTP-Status"
                        : "noch keine"}
                </strong>
              </div>
            </div>
          )}
        </div>
        <aside className="packet-inspector">
          <div className="inspector-tabs">
            <span
              className={
                ["ingress", "route", "reply", "predict"].includes(frame.stage)
                  ? "active"
                  : ""
              }
            >
              {isBalance ? "Verbindung" : "Paket"}
            </span>
            <span
              className={
                ["check", "compare"].includes(frame.stage) ? "active" : ""
              }
            >
              Regel
            </span>
            <span
              className={
                ["verdict", "result"].includes(frame.stage) ? "active" : ""
              }
            >
              Ergebnis
            </span>
          </div>
          <div className="inspector-content">
            <div className="inspector-file">
              {isXdp
                ? "xdp_filter.pseudo"
                : isBalance
                  ? "connection_map"
                  : "flow_details"}
              <span>{isXdp ? "PSEUDOCODE" : "MODELLDATEN"}</span>
            </div>
            {isBalance ? (
              <>
                <dl>
                  <div>
                    <dt>HTTP-Anfragen</dt>
                    <dd>{frame.requests.length} / 5</dd>
                  </div>
                  <div>
                    <dt>Keep-alive</dt>
                    <dd>{c.reuse ? "aktiv" : "neue Verbindung je Request"}</dd>
                  </div>
                  <div>
                    <dt>Backend A</dt>
                    <dd>
                      {frame.requests.filter((r) => r.backend === "a").length}{" "}
                      Antworten
                    </dd>
                  </div>
                  <div>
                    <dt>Backend B</dt>
                    <dd>
                      {frame.requests.filter((r) => r.backend === "b").length}{" "}
                      Antworten
                    </dd>
                  </div>
                </dl>
                <div
                  className={`distribution ${frame.requests.length ? "" : "empty"}`}
                >
                  <i
                    style={{
                      width: frame.requests.length
                        ? `${(frame.requests.filter((r) => r.backend === "a").length / frame.requests.length) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
                <p className="inspector-note">
                  {state.step === 0
                    ? "Die Service-Adresse bleibt gleich. Beobachtet, wann eine neue conn-ID entsteht."
                    : last
                      ? ""
                      : "Eine conn-ID steht für eine TCP-Verbindung. Verfolgt ihr Backend über mehrere HTTP-Anfragen."}
                </p>
              </>
            ) : (
              <>
                <dl>
                  <div>
                    <dt>Quelle</dt>
                    <dd>
                      {c.client === "trusted"
                        ? "10.0.0.10 · Client A"
                        : "10.0.0.11 · Client B"}
                    </dd>
                  </div>
                  {!isXdp && (
                    <div>
                      <dt>Protokoll</dt>
                      <dd>TCP</dd>
                    </div>
                  )}
                  <div
                    className={
                      frame.stage === "ingress" ? "field-highlight" : ""
                    }
                  >
                    <dt>Zielport</dt>
                    <dd>{c.port}</dd>
                  </div>
                </dl>
                {!last && (
                  <div
                    className={`inspector-rule ${["check", "compare"].includes(frame.stage) ? "highlight" : ""}`}
                  >
                    {isXdp ? (
                      <>
                        <span className="code-label">Regel-Map</span>
                        <code>
                          filter_aktiv = <b>{String(c.filter)}</b>
                          <br />
                          gesperrter_port = <b>9090</b>
                        </code>
                        <hr />
                        <code>
                          aktiv <em>und</em> port == 9090
                          <br />? <strong>DROP</strong> : PASS
                        </code>
                      </>
                    ) : c.kind === "policy" ? (
                      <>
                        <span className="code-label">Ingress-Policy</span>
                        <code>
                          aktiv: <b>{String(c.policy)}</b>
                          <br />
                          erlaubte_quelle: <b>Client A</b>
                          <br />
                          ziel: <b>web:8080</b>
                        </code>
                      </>
                    ) : (
                      <>
                        <span className="code-label">Zuordnung</span>
                        <code>
                          service: <b>web:8080</b>
                          <br />
                          backend:{" "}
                          <b>
                            {["route", "reply", "result"].includes(frame.stage)
                              ? "backend-a"
                              : "noch unbekannt"}
                          </b>
                        </code>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
            {last && (
              <div
                className={`inspector-result ${state.prediction === null ? "" : state.prediction === question.correct ? "correct" : "reconsider"}`}
              >
                <span>
                  {state.prediction === null
                    ? "Ergebnis"
                    : state.prediction === question.correct
                      ? "Vorhersage bestätigt"
                      : "Vorhersage überprüfen"}
                </span>
                <strong>{question.options[question.correct]}</strong>
              </div>
            )}
          </div>
        </aside>
      </div>
      <div className="experiment-bottom">
        <div className="step-track">
          {trace.map((f, i) => (
            <span
              key={i}
              className={
                i === state.step ? "current" : i < state.step ? "done" : ""
              }
            >
              <i />
              {i === 0
                ? "Vorhersage"
                : i === trace.length - 1
                  ? "Auswertung"
                  : c.kind === "balance"
                    ? `Request ${i}`
                    : {
                        ingress: "Eingang",
                        route: "Zuordnung",
                        reply: "Antwort",
                        check: "Regel",
                        compare: "Abgleich",
                        verdict: "Entscheidung",
                      }[f.stage] || f.stage}
            </span>
          ))}
        </div>
        {experiment.cases.length > 2 && (
          <div className="case-evidence">
            {experiment.cases.map((candidate, i) => (
              <span
                key={candidate.title}
                className={
                  state.completed.includes(i) || (last && state.caseIndex === i)
                    ? "verified"
                    : ""
                }
              >
                {i + 1}
                <b>
                  {state.completed.includes(i) ||
                  (last && state.caseIndex === i)
                    ? outcome(candidate)
                    : "—"}
                </b>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function NetworkScene({
  xdp,
  client,
  port,
  stage,
  verdict,
  backend,
  hook,
}: {
  xdp: boolean;
  client: string;
  port: number;
  stage: string;
  verdict: string | null;
  backend: string;
  hook: string;
}) {
  const stopped = verdict === "DROP",
    started = stage !== "predict",
    routed =
      ["route", "reply", "verdict", "result"].includes(stage) && !stopped;
  const paths = xdp
    ? ["M180 130 L430 130", "M510 130 L750 130"]
    : [
        "M180 130 C270 130 270 130 365 130",
        backend === "a"
          ? "M485 130 C610 130 600 65 745 65"
          : "M485 130 C610 130 600 215 745 215",
      ];
  const motion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const node = (
    x: number,
    y: number,
    label: string,
    detail: string,
    type: string,
    active: boolean,
  ) => (
    <g className={`scene-node ${type} ${active ? "node-active" : ""}`}>
      <rect x={x - 95} y={y - 44} width="190" height="88" rx="12" />
      <text x={x} y={y - 4} className="node-name">
        {label}
      </text>
      <text x={x} y={y + 22} className="node-detail">
        {detail}
      </text>
    </g>
  );
  return (
    <div className="network-scene">
      <svg
        viewBox="0 0 940 260"
        role="img"
        aria-label={
          xdp
            ? "Paketweg: TCP-Paket → XDP-Prüfung → weitere Verarbeitung"
            : "Verbindungsweg: Client → Service und Policy → Backend"
        }
      >
        <defs>
          <pattern
            id="scene-grid"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="#d6e0e9" />
          </pattern>
        </defs>
        <rect width="940" height="260" fill="url(#scene-grid)" />
        <rect
          className="kernel-zone"
          x="300"
          y="12"
          width="620"
          height="240"
          rx="18"
        />
        <text x="325" y="40" className="kernel-label">
          {xdp ? "EMPFANGSPFAD" : "LINUX · MODELLIERTER DATENPFAD"}
        </text>
        <path
          className={`scene-path ${started ? "path-active" : ""}`}
          d={paths[0]}
        />
        {xdp ? (
          <path
            className={`scene-path ${routed ? "path-active" : ""} ${stopped ? "unreached" : ""}`}
            d={paths[1]}
          />
        ) : (
          <>
            <path
              className={`scene-path ${routed && backend === "a" ? "path-active" : ""}`}
              d="M485 130 C610 130 600 65 745 65"
            />
            <path
              className={`scene-path ${routed && backend === "b" ? "path-active" : ""}`}
              d="M485 130 C610 130 600 215 745 215"
            />
          </>
        )}
        {node(
          100,
          130,
          xdp ? `TCP/${port}` : client === "trusted" ? "Client A" : "Client B",
          xdp ? "eingehendes Paket" : "TCP-Verbindung",
          "client-node",
          started,
        )}
        {node(
          xdp ? 470 : 425,
          130,
          xdp ? "XDP-Hook" : "web:8080",
          xdp ? "Portregel prüfen" : "Service / Ingress-Policy",
          "service-node",
          ["check", "compare", "verdict"].includes(stage),
        )}
        {xdp ? (
          node(
            810,
            130,
            "Netzwerkstack",
            "weitere Verarbeitung",
            "backend-node",
            routed,
          )
        ) : (
          <>
            {node(
              825,
              65,
              "Backend A",
              "Python · :8080",
              "backend-node",
              routed && backend === "a",
            )}
            {node(
              825,
              215,
              "Backend B",
              "Python · :8080",
              "backend-b-node",
              routed && backend === "b",
            )}
          </>
        )}
        {stage === "reply" && (
          <path
            className="scene-path scene-reply"
            d="M745 85 C610 85 600 150 485 150 L180 150"
          />
        )}
        {stage === "reply" && motion && (
          <circle className="moving-packet reply-packet" r="7">
            <animateMotion
              dur="1.25s"
              fill="freeze"
              path="M745 85 C610 85 600 150 485 150 L180 150"
            />
          </circle>
        )}
        {started && motion && stage !== "reply" && (
          <circle className="moving-packet" r="7">
            <animateMotion dur="1.25s" fill="freeze" path={paths[0]} />
          </circle>
        )}
        {routed && motion && stage !== "reply" && (
          <circle className="moving-packet" r="7">
            <animateMotion dur="1.25s" fill="freeze" path={paths[1]} />
          </circle>
        )}
        {stopped && !xdp && (
          <path className="scene-path policy-stop" d="M485 130 L610 130" />
        )}
        {stopped && (
          <g className="scene-stop">
            <circle cx="610" cy="130" r="25" />
            <path d="m600 120 20 20 m0-20-20 20" />
            <text x="610" y="204">
              DROP · hier endet der Weg
            </text>
          </g>
        )}
      </svg>
      <div className="scene-hook">
        <span />
        {hook}
      </div>
    </div>
  );
}
