// Fixed, reviewable commands. No request data is interpolated into shell code.
export const namespace = "ebpf-talk";
const execClient = (client, mode, count) => [
  "exec",
  "-n",
  namespace,
  client,
  "--",
  "python",
  "/app/client.py",
  mode,
  String(count),
];
const agent = (...args) => [
  "exec",
  "-n",
  "kube-system",
  "daemonset/cilium",
  "-c",
  "cilium-agent",
  "--",
  "cilium-dbg",
  ...args,
];
const xdp = (command, label) => ({
  label,
  binary: "docker",
  experiment: "xdp",
  args: ["exec", "ebpf-talk-xdp", "python3", "/opt/xdp/control.py", command],
});
export const actions = Object.freeze({
  "xdp-status": xdp("status", "Maps lesen"),
  "xdp-block": xdp("block", "9090 sperren"),
  "xdp-clear": xdp("clear", "Regel aufheben"),
  "xdp-8080": xdp("test8080", "8080 testen"),
  "xdp-9090": xdp("test9090", "9090 testen"),
  "request-a": {
    label: "Client A · eine Anfrage",
    args: execClient("client-a", "new", 1),
  },
  "request-b": {
    label: "Client B · eine Anfrage",
    args: execClient("client-b", "new", 1),
  },
  keepalive: {
    label: "5 Requests · eine Verbindung",
    args: execClient("client-a", "keepalive", 5),
  },
  "new-connections": {
    label: "10 neue Verbindungen",
    args: execClient("client-a", "new", 10),
  },
  "policy-open": {
    label: "Beide Clients erlauben",
    args: ["apply", "-f", "lab/manifests/policy-open.yaml"],
  },
  "policy-trusted": {
    label: "Nur Client A erlauben",
    args: ["apply", "-f", "lab/manifests/policy-trusted.yaml"],
  },
  endpoints: {
    label: "Identitäten und Endpoints",
    args: agent("endpoint", "list"),
  },
  "lb-map": {
    label: "Service-Map im Kernel",
    args: agent("bpf", "lb", "list"),
  },
  "policy-map": {
    label: "Policy-Maps im Kernel",
    args: agent("bpf", "policy", "get", "--all"),
  },
  "backend-logs": {
    label: "Backend-Logs",
    args: [
      "logs",
      "-n",
      namespace,
      "-l",
      "app=web",
      "--tail=12",
      "--prefix=true",
    ],
  },
  resources: {
    label: "Pods und Service",
    args: ["get", "pods,service", "-n", namespace, "-o", "wide"],
  },
});
export function publicCommand(id) {
  const action = Object.hasOwn(actions, id) ? actions[id] : null;
  return action
    ? (action.binary || "kubectl") + " " + action.args.join(" ")
    : null;
}
export function summarizeFlows(raw) {
  return raw
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      try {
        const envelope = JSON.parse(line),
          f = envelope.flow || envelope;
        if (!f.verdict) return [];
        return [
          {
            time: f.time || envelope.time,
            source: f.source?.pod_name || f.IP?.source || "?",
            destination: f.destination?.pod_name || f.IP?.destination || "?",
            sourceIdentity: f.source?.identity,
            destinationIdentity: f.destination?.identity,
            verdict: f.verdict,
            dropReason: f.drop_reason_desc || null,
            port: f.l4?.TCP?.destination_port,
            summary:
              f.Summary ||
              (f.l7?.http?.method &&
                `${f.l7.http.method} ${f.l7.http.url} ${f.l7.http.code || ""}`) ||
              "TCP",
            raw: f,
          },
        ];
      } catch {
        return [];
      }
    });
}
