export type XdpEvidence = {
  action: string;
  blocked_port: number;
  before: Record<"PASS" | "DROP", number>;
  after: Record<"PASS" | "DROP", number>;
  delta: Record<"PASS" | "DROP", number>;
  request: {
    port: number;
    status?: number;
    error?: string;
    request_id: string;
  } | null;
  program: { id: number; name: string };
  attachment: {
    ifname: string;
    xdp?: { mode?: number; prog?: { id: number } };
  };
};
export function XdpOutput({
  evidence,
  stderr,
  at,
}: {
  evidence?: XdpEvidence | null;
  stderr?: string;
  at?: string;
}) {
  if (!evidence)
    return (
      <div className="lab-empty">
        <h2>Eigener Filter, echte Pakete</h2>
        <p>
          1. 8080 und 9090 testen.
          <br />
          2. Regel-Map auf 9090 setzen.
          <br />
          3. Beide Ports erneut testen.
          <br />
          4. Regel aufheben und 9090 prüfen.
        </p>
        {stderr && <pre className="stderr">{stderr}</pre>}
      </div>
    );
  const e = evidence;
  return (
    <div className="real-output xdp-output">
      <div className="output-stamp">
        <span>
          BPF-MAPS · {at ? new Date(at).toLocaleTimeString("de-AT") : "MESSUNG"}
        </span>
        <span>Programm #{e.program.id}</span>
      </div>
      <h2>
        blocked_port[0] = <em>{e.blocked_port}</em>
      </h2>
      <p>
        {e.blocked_port
          ? `TCP-Zielport ${e.blocked_port} wird verworfen.`
          : "0 = Filterregel deaktiviert; geprüfte TCP-Pakete passieren."}
      </p>
      <table className="response-table">
        <thead>
          <tr>
            <th>Paketzähler</th>
            <th>Vorher</th>
            <th>Nachher</th>
            <th>Δ</th>
          </tr>
        </thead>
        <tbody>
          {(["PASS", "DROP"] as const).map((key) => (
            <tr key={key}>
              <th className={key === "DROP" ? "drop" : ""}>{key}</th>
              <td>{e.before[key]}</td>
              <td>{e.after[key]}</td>
              <td>
                <strong>+{e.delta[key]}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {e.request ? (
        <div className="xdp-request">
          <h2>
            TCP/{e.request.port} →{" "}
            <span className={e.request.error ? "drop" : "http-status"}>
              {e.request.error || `HTTP ${e.request.status}`}
            </span>
          </h2>
          <p>Request-ID: {e.request.request_id}</p>
        </div>
      ) : (
        <p className="xdp-request">
          Map gelesen oder geändert. Jetzt die Wirkung mit einer Anfrage prüfen.
        </p>
      )}
      <p className="xdp-hook">
        Hook: talk-server/{e.attachment.ifname} ·{" "}
        {e.attachment.xdp?.mode === 2
          ? "Generic / SKB"
          : `XDP-Modus ${e.attachment.xdp?.mode ?? "unbekannt"}`}
      </p>
    </div>
  );
}
