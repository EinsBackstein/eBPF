export const initialLab = {
  policy: false,
  filter: false,
  port: 9090,
  client: "trusted",
  sent: 0,
  pass: 0,
  drop: 0,
  a: 0,
  b: 0,
  events: [],
};
export function packetDecision({ mode, policy, filter, port, client }) {
  if (mode === "xdp" && filter && port === 9090)
    return { action: "DROP", reason: "XDP · TCP/9090" };
  if (mode !== "xdp" && policy && client === "guest")
    return { action: "DROP", reason: "Ingress-Policy · Quelle nicht erlaubt" };
  return {
    action: "PASS",
    reason: mode === "xdp" ? "XDP_PASS" : "Verbindung erlaubt",
  };
}
export function sendPackets(lab, mode, count, random = Math.random) {
  let next = { ...lab, events: [...lab.events] };
  for (let i = 0; i < count; i++) {
    const { action, reason } = packetDecision({ ...lab, mode });
    const backend =
      action === "PASS" && mode !== "xdp" ? (random() < 0.5 ? "a" : "b") : null;
    next.sent++;
    next[action === "PASS" ? "pass" : "drop"]++;
    if (backend) next[backend]++;
    next.events.unshift({
      id: next.sent,
      action,
      reason,
      backend,
      port: mode === "xdp" ? lab.port : 8080,
      client: lab.client,
    });
  }
  next.events = next.events.slice(0, 30);
  return next;
}
export function readSnapshot(value, maxSlides) {
  if (
    !value ||
    typeof value !== "object" ||
    !Number.isInteger(value.index) ||
    value.index < 0 ||
    value.index >= maxSlides
  )
    return null;
  const l = value.lab;
  if (
    !l ||
    !["trusted", "guest"].includes(l.client) ||
    ![8080, 9090].includes(l.port) ||
    typeof l.policy !== "boolean" ||
    typeof l.filter !== "boolean"
  )
    return null;
  if (
    !["sent", "pass", "drop", "a", "b"].every(
      (k) => Number.isSafeInteger(l[k]) && l[k] >= 0,
    ) ||
    l.sent !== l.pass + l.drop ||
    !Array.isArray(l.events) ||
    l.events.length > 30
  )
    return null;
  if (
    !l.events.every(
      (e) =>
        e &&
        Number.isSafeInteger(e.id) &&
        ["PASS", "DROP"].includes(e.action) &&
        typeof e.reason === "string" &&
        e.reason.length < 120 &&
        [null, "a", "b"].includes(e.backend) &&
        [8080, 9090].includes(e.port) &&
        ["trusted", "guest"].includes(e.client),
    )
  )
    return null;
  return {
    index: value.index,
    black: !!value.black,
    lab: l,
    answers: Array.isArray(value.answers)
      ? value.answers.filter((v) => Number.isInteger(v) && v >= 0 && v < 3)
      : [],
  };
}
