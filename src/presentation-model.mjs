const outputScrollKeys = ["result", "terminal", "logs", "flowList", "flowDetails", "flowJson"];
export function readOutputScroll(value) {
  const safe = {};
  for (const key of outputScrollKeys) {
    const position = value?.[key];
    if (Number.isFinite(position?.x) && Number.isFinite(position?.y))
      safe[key] = { x: Math.max(0, Math.min(1, position.x)), y: Math.max(0, Math.min(1, position.y)) };
  }
  return safe;
}
export const initialLab = () => ({
  view: "split",
  source: "server",
  codeScroll: 0,
  codeScrollX: 0,
  outputScroll: {},
  flowIndex: 0,
  run: null,
});
export function readPresentation(value, count) {
  if (
    !value ||
    !Number.isInteger(value.index) ||
    value.index < 0 ||
    value.index >= count ||
    typeof value.black !== "boolean"
  )
    return null;
  const lab = value.lab || initialLab();
  const safe = {
    view: ["split", "source", "terminal", "flows", "logs"].includes(lab.view)
      ? lab.view
      : lab.view === "hubble"
        ? "flows"
        : "split",
    source: [
      "server",
      "client",
      "open",
      "trusted",
      "workloads",
      "xdpControl",
      "xdpMaps",
      "xdpRequest",
    ].includes(lab.source)
      ? lab.source
      : "server",
    codeScroll: Number.isFinite(lab.codeScroll)
      ? Math.max(0, Math.min(1, lab.codeScroll))
      : 0,
    codeScrollX: Number.isFinite(lab.codeScrollX)
      ? Math.max(0, Math.min(1, lab.codeScrollX))
      : 0,
    outputScroll: readOutputScroll(lab.outputScroll),
    flowIndex: Number.isInteger(lab.flowIndex)
      ? Math.max(0, Math.min(79, lab.flowIndex))
      : 0,
    run:
      lab.run &&
      typeof lab.run.id === "string" &&
      typeof lab.run.stdout === "string" &&
      Array.isArray(lab.run.flows?.events)
        ? lab.run
        : null,
  };
  return {
    index: value.index,
    black: value.black,
    lab: safe,
    answers: Array.isArray(value.answers)
      ? [
          ...new Set(
            value.answers.filter((n) => Number.isInteger(n) && n >= 0 && n < 3),
          ),
        ]
      : [],
  };
}

// Audience interactions may only change the current code viewport or lab view.
/** @param {string | null} [runId] */
export function readLabInteraction(value, index, source, runId = null) {
  if (!value || value.index !== index || value.source !== source ||
      !value.patch || typeof value.patch !== "object") return null;
  const patch = {};
  const views = source.startsWith("xdp")
    ? ["split", "source", "terminal"]
    : ["split", "source", "terminal", "flows", "logs"];
  if (views.includes(value.patch.view)) patch.view = value.patch.view;
  for (const key of ["codeScroll", "codeScrollX"]) {
    if (Number.isFinite(value.patch[key]))
      patch[key] = Math.max(0, Math.min(1, value.patch[key]));
  }
  if (value.runId === runId && value.patch.outputScroll) {
    const positions = readOutputScroll(value.patch.outputScroll);
    if (Object.keys(positions).length) patch.outputScroll = positions;
  }
  return Object.keys(patch).length ? patch : null;
}
