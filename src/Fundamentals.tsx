import { Fragment } from "react";

const topics = [["definition", "Idee"], ["hooks", "Hook"], ["verifier", "Verifier"], ["jit", "JIT"], ["maps", "Map"]];
const content: Record<string, {lead: string; cards: [string, string][]; flow: string[]; caption: string}> = {
  definition: {
    lead: 'eBPF = "extended Berkeley Packet Filter"',
    cards: [["Einsatz", "Netzwerk · Systembeobachtung · Sicherheit"], ["Sandbox im Kernel", "Geprüfter Code mit begrenzten Zugriffen"]],
    flow: ["Bytecode erzeugen", "Programm prüfen", "An Hook ausführen"],
    caption: "Eigener Befehlssatz · Interpreter oder JIT · kein zusätzliches Gastbetriebssystem",
  },
  hooks: {
    lead: "Hook = Einsatzpunkt für ein Ereignis",
    cards: [["XDP · eXpress Data Path", "Eingehende Pakete früh filtern"], ["TC · Traffic Control", "Pakete am Ein- und Ausgang prüfen oder umleiten"], ["Socket-Hooks", "Beim Verbindungsaufbau das Ziel prüfen oder ändern"], ["Tracepoints", "Kernelereignisse beobachten, etwa Prozessstarts"]],
    flow: [],
    caption: "",
  },
  verifier: {
    lead: "Programmprüfung beim Laden",
    cards: [["Speichergrenzen", "Nur vorhandene Paketdaten lesen"], ["Begrenzte Ausführung", "Keine endlos laufende Verarbeitung"], ["Kein Logiktest", "Die gewünschte Regel selbst testen"]],
    flow: ["Bytecode", "Verifier prüft", "Zulassen / ablehnen"],
    caption: "Auch ein zugelassenes Programm kann den falschen Port sperren.",
  },
  jit: {
    lead: "",
    cards: [["Just-in-Time-Kompilierung", "Geprüften Bytecode beim Laden für die jeweilige CPU übersetzen"], ["Native Ausführung", "CPU führt Maschinencode aus, ohne einzelne Bytecode-Anweisungen zu interpretieren"]],
    flow: ["Geprüfter Bytecode", "JIT übersetzt", "CPU-Maschinencode"],
    caption: "Bei aktiviertem JIT · keine erneute Übersetzung pro Paket",
  },
  maps: {
    lead: "Maps speichern Regeln und Zähler",
    cards: [["Regel", "Welcher Port ist gesperrt? → 9090"], ["Zähler", "Wie viele Pakete? → PASS / DROP"], ["Austausch", "Applikation und eBPF-Programm lesen und schreiben"]],
    flow: ["Applikation", "Map", "eBPF im Kernel"],
    caption: "Konfiguration ändern, ohne das Programm neu zu laden",
  },
};
export function Fundamentals({ topic }: { topic: string }) {
  const c = content[topic];
  return <div className="docs-columns fundamentals">
    <div className="docs-prose keynote-prose">
      {c.lead && <p className="keynote-lead">{c.lead}</p>}
      <div className={`concept-cards ${topic === "hooks" ? "hook-grid" : ""} ${["definition", "jit"].includes(topic) ? "definition-grid" : ""}`}>{c.cards.map(([title, detail]) => <section key={title}><h2>{title}</h2><p>{detail}</p></section>)}</div>
      {c.flow.length > 0 && <div className="simple-flow" aria-label={c.flow.join(topic === "maps" ? " ↔ " : " → ")}>
        {c.flow.map((label, i) => <Fragment key={label}>
          {i > 0 && <b className="flow-arrow" aria-hidden="true">{topic === "maps" ? "↔" : "→"}</b>}
          <span className={i === 1 ? "focus" : ""}>{label}</span>
        </Fragment>)}
      </div>}
      {c.caption && <p className="fundamental-caption">{c.caption}</p>}
    </div>
    <aside className="docs-toc" aria-label="Aktuelles Grundlagenthema"><h2>Die Bausteine</h2>{topics.map(([id, label]) => <p key={id} className={topic === id ? "active" : ""} aria-current={topic === id ? "step" : undefined}>{label}</p>)}</aside>
  </div>;
}
