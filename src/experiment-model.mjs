// Deterministic teaching experiments, not a live eBPF runtime.
/** @typedef {{request:number,connection:number,backend:string,client:string}} Sample */
/** @typedef {{stage:string,title:string,explanation:string,verdict:string|null,requests:Sample[],appReached:boolean}} Frame */
const scenario = (title, fields) => ({
  title,
  client: "trusted",
  port: 8080,
  filter: false,
  policy: false,
  reuse: false,
  ...fields,
});
export const experiments = [
  {
    name: "Observability",
    hook: "Flow-Beobachtung",
    color: "green",
    cases: [
      scenario("Client A verfolgen", { kind: "observe", client: "trusted" }),
      scenario("Client B verfolgen", { kind: "observe", client: "guest" }),
    ],
  },
  {
    name: "Load Balancing",
    hook: "Socket-LB · Verbindungszuordnung",
    color: "blue",
    cases: [
      scenario("5 Requests · 1 TCP-Verbindung", {
        kind: "balance",
        reuse: true,
      }),
      scenario("5 Requests · 5 TCP-Verbindungen", {
        kind: "balance",
        reuse: false,
      }),
    ],
  },
  {
    name: "Network Policy",
    hook: "Ingress-Policy · Identität der Quelle",
    color: "orange",
    cases: [
      scenario("1 · Client B vor der Regel", {
        kind: "policy",
        client: "guest",
      }),
      scenario("2 · Client B mit Regel", {
        kind: "policy",
        client: "guest",
        policy: true,
      }),
      scenario("3 · Client A als Kontrolle", {
        kind: "policy",
        client: "trusted",
        policy: true,
      }),
      scenario("4 · Client B nach Rücknahme", {
        kind: "policy",
        client: "guest",
      }),
    ],
  },
  {
    name: "XDP",
    hook: "XDP · früher Empfangspfad",
    color: "yellow",
    cases: [
      scenario("1 · TCP/9090 ohne Filter", { kind: "xdp", port: 9090 }),
      scenario("2 · TCP/9090 sperren", {
        kind: "xdp",
        port: 9090,
        filter: true,
      }),
      scenario("3 · TCP/8080 als Kontrolle", {
        kind: "xdp",
        port: 8080,
        filter: true,
      }),
      scenario("4 · TCP/9090 wieder freigeben", { kind: "xdp", port: 9090 }),
    ],
  },
];
export const initialExperiment = () => ({
  caseIndex: 0,
  step: 0,
  prediction: null,
  completed: [],
});
export function experimentFor(index) {
  return experiments[Math.max(0, Math.min(3, index - 8))];
}
export function caseFor(index, caseIndex) {
  const e = experimentFor(index);
  return e.cases[caseIndex] || e.cases[0];
}
export function outcome(c) {
  return c.kind === "xdp"
    ? c.filter && c.port === 9090
      ? "DROP"
      : "PASS"
    : c.policy && c.client === "guest"
      ? "DROP"
      : "PASS";
}
export function requestSamples(c) {
  return Array.from({ length: c.kind === "balance" ? 5 : 1 }, (_, i) => ({
    request: i + 1,
    connection: c.reuse ? 1 : i + 1,
    backend: c.reuse ? "a" : ["a", "b", "b", "a", "b"][i],
    client: c.client,
  }));
}
export function questionFor(c) {
  if (c.kind === "balance")
    return {
      text: "Wann wird das Backend neu ausgewählt?",
      options: ["Bei einer neuen TCP-Verbindung", "Bei jeder HTTP-Anfrage"],
      correct: 0,
    };
  if (c.kind === "observe")
    return {
      text: "Verrät die Service-Adresse allein, welches Backend antwortet?",
      options: [
        "Ja, die Service-Adresse genügt",
        "Nein, wir brauchen die Antwort oder Flowdetails",
      ],
      correct: 1,
    };
  return {
    text:
      c.kind === "xdp"
        ? `Wird TCP/${c.port} vom XDP-Hook weitergereicht?`
        : `Darf Client ${c.client === "trusted" ? "A" : "B"} mit dieser Regel den Dienst erreichen?`,
    options:
      c.kind === "xdp"
        ? ["Ja · XDP_PASS", "Nein · XDP_DROP"]
        : [
            "Ja · der Zugriff bleibt erlaubt",
            "Nein · der Zugriff wird verworfen",
          ],
    correct: outcome(c) === "PASS" ? 0 : 1,
  };
}
export function buildTrace(c) {
  const verdict = outcome(c),
    allowed = verdict === "PASS",
    client = c.client === "trusted" ? "Client A" : "Client B";
  /** @param {string} stage @param {string} title @param {string} explanation @param {Partial<Frame>} extra @returns {Frame} */
  const frame = (stage, title, explanation, extra = {}) => ({
    stage,
    title,
    explanation,
    verdict: null,
    requests: [],
    appReached: false,
    ...extra,
  });
  const predict = frame("predict", "Was erwartet ihr?", questionFor(c).text);
  if (c.kind === "balance")
    return [
      predict,
      ...requestSamples(c).map((r, i) =>
        frame(
          "route",
          `HTTP-Anfrage ${i + 1} · TCP-Verbindung ${r.connection}`,
          c.reuse
            ? i === 0
              ? "Für conn-01 wird Backend A ausgewählt. Die Verbindung bleibt bestehen."
              : "Die HTTP-Anfrage nutzt conn-01 erneut. Keine neue Verbindung, keine neue Backend-Auswahl."
            : `conn-0${r.connection} wird neu aufgebaut und in diesem Beispiel Backend ${r.backend.toUpperCase()} zugeordnet.`,
          {
            requests: requestSamples(c).slice(0, i + 1),
            appReached: true,
            verdict: "PASS",
          },
        ),
      ),
      frame(
        "result",
        c.reuse
          ? "5 HTTP-Anfragen. 1 Verbindung. 1 Backend."
          : "5 HTTP-Anfragen. 5 neue Verbindungen.",
        c.reuse
          ? "Keep-alive hält die TCP-Verbindung offen. Das Backend bleibt für diese Verbindung gleich."
          : "Die Auswahl erfolgt je Verbindung. Die Beispielverteilung A:2 / B:3 ist keine zugesicherte Quote.",
        { requests: requestSamples(c), appReached: true, verdict: "PASS" },
      ),
    ];
  if (c.kind === "observe")
    return [
      predict,
      frame(
        "ingress",
        `${client} verbindet sich mit web:8080`,
        "Die Service-Adresse ist das logische Ziel. Der antwortende Prozess steht damit noch nicht fest.",
      ),
      frame(
        "route",
        "Die Verbindung wird Backend A zugeordnet",
        "Jetzt kennen wir die konkrete Route: Quelle → Service → Backend A.",
      ),
      frame(
        "reply",
        "HTTP 200 · Antwort: backend-a",
        "Die Antwort nennt den Prozess, der diese Anfrage tatsächlich bedient hat.",
        { appReached: true, verdict: "PASS", requests: requestSamples(c) },
      ),
      frame(
        "result",
        "Quelle + Route + Antwort zusammenführen",
        "Ein Flow erklärt den Kommunikationsweg. Die Backend-Antwort belegt, welcher Prozess die Anfrage bedient hat.",
        { appReached: true, verdict: "PASS", requests: requestSamples(c) },
      ),
    ];
  if (c.kind === "policy")
    return [
      predict,
      frame(
        "ingress",
        `${client} startet einen Verbindungsversuch`,
        "Beide Clients verwenden dieselbe Service-Adresse und TCP/8080.",
      ),
      frame(
        "check",
        "Ingress-Regel prüft die Identität der Quelle",
        c.policy
          ? "Die Regel erlaubt nur Client A. Jetzt wird die Quelle mit der erlaubten Identität verglichen."
          : "Ohne diese Einschränkung sind beide Clients erlaubt.",
      ),
      frame(
        "verdict",
        allowed
          ? "Zugriff erlaubt → Backend A"
          : `${client} wird vor dem Dienst blockiert`,
        allowed
          ? "Die Verbindung darf den Dienst erreichen. Der Server kann antworten."
          : "Der Server sieht keinen HTTP-Request. Ein Netzwerk-Drop ist keine HTTP-403-Antwort.",
        {
          verdict,
          appReached: allowed,
          requests: allowed ? requestSamples(c) : [],
        },
      ),
      frame(
        "result",
        allowed
          ? "HTTP 200 · backend-a"
          : "Kein HTTP-Status · Verbindung blockiert",
        allowed
          ? "Erlaubter Kontrollzugriff oder erfolgreiche Wiederherstellung. Die Regel betrifft Netzwerkidentitäten, keine Benutzeranmeldung."
          : "Der Drop passt zur aktiven Policy und zur Quelle Client B. Als Nächstes Client A und die Rücknahme prüfen.",
        {
          verdict,
          appReached: allowed,
          requests: allowed ? requestSamples(c) : [],
        },
      ),
    ];
  return [
    predict,
    frame(
      "ingress",
      `TCP-Header lesen: Zielport ${c.port}`,
      "Das Erklärmodell setzt einen bereits auf gültige Grenzen geprüften TCP-Header voraus.",
    ),
    frame(
      "check",
      "Die Regel-Map nachschlagen",
      c.filter
        ? "Regel aktiv: TCP-Zielport 9090 sperren. Konfiguration und Paket werden getrennt betrachtet."
        : "Der Filter ist deaktiviert. Die Portregel wird nicht angewendet.",
    ),
    frame(
      "compare",
      c.filter
        ? `${c.port} = 9090? ${c.port === 9090 ? "Ja" : "Nein"}`
        : "Keine aktive Portregel",
      c.filter
        ? c.port === 9090
          ? "Der TCP-Zielport trifft die Sperrregel."
          : "Der Kontrollport trifft die Sperrregel nicht."
        : "Ohne aktive Sperre wird das Paket weitergereicht.",
    ),
    frame(
      "verdict",
      allowed
        ? "XDP_PASS · weitere Verarbeitung"
        : "XDP_DROP · Verarbeitung hier beendet",
      allowed
        ? "PASS-Zähler +1. Das Paket darf zum restlichen Netzwerkpfad weiterlaufen."
        : "DROP-Zähler +1. Dieses Paket erreicht weder die weitere Verarbeitung noch den HTTP-Dienst.",
      { verdict },
    ),
    frame(
      "result",
      allowed
        ? `TCP/${c.port}: vom Modell durchgelassen`
        : `TCP/${c.port}: vom Modell verworfen`,
      allowed
        ? "XDP_PASS erlaubt die weitere Verarbeitung; erst ein zusätzlicher Diensttest belegt eine erfolgreiche HTTP-Antwort."
        : "Der Drop wurde am XDP-Hook entschieden. Das ist kein Cilium-/Hubble-Policy-Drop.",
      { verdict },
    ),
  ];
}
export function readPresentation(value, maxSlides) {
  if (
    !value ||
    typeof value !== "object" ||
    !Number.isInteger(value.index) ||
    value.index < 0 ||
    value.index >= maxSlides
  )
    return null;
  const e = value.experiment;
  if (
    !e ||
    !Number.isInteger(e.caseIndex) ||
    e.caseIndex < 0 ||
    e.caseIndex >= experimentFor(value.index).cases.length
  )
    return null;
  if (
    !Number.isInteger(e.step) ||
    e.step < 0 ||
    e.step >= buildTrace(caseFor(value.index, e.caseIndex)).length
  )
    return null;
  if (e.prediction !== null && e.prediction !== 0 && e.prediction !== 1)
    return null;
  if (
    !Array.isArray(e.completed) ||
    e.completed.length > 4 ||
    !e.completed.every(
      (i) =>
        Number.isInteger(i) &&
        i >= 0 &&
        i < experimentFor(value.index).cases.length,
    )
  )
    return null;
  return {
    index: value.index,
    black: !!value.black,
    experiment: {
      caseIndex: e.caseIndex,
      step: e.step,
      prediction: e.prediction,
      completed: [...new Set(e.completed)],
    },
    answers: Array.isArray(value.answers)
      ? value.answers.filter((i) => Number.isInteger(i) && i >= 0 && i < 3)
      : [],
  };
}
