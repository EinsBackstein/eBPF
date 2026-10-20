export const initialLab = () => ({
  view: "split",
  source: "server",
  page: 0,
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
    view: ["split", "source", "terminal", "hubble", "flows", "logs"].includes(
      lab.view,
    )
      ? lab.view
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
    page: Number.isInteger(lab.page) ? Math.max(0, Math.min(20, lab.page)) : 0,
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
