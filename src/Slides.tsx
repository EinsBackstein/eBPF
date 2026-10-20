import { slides, sources, questions } from "./deck";
import { LabSlide, type LabState } from "./Lab";
import { KernelIllustration } from "./Illustrations";

function Figure({ file, caption }: { file: string; caption: string }) {
  return (
    <figure className="original-figure">
      <img src={`./vendor/cilium/${file}`} alt={caption} />
      <figcaption>{caption} · Cilium Authors · Originalgrafik</figcaption>
    </figure>
  );
}
export function SlideContent({
  index,
  lab,
  answers,
}: {
  index: number;
  lab: LabState;
  answers: number[];
}) {
  const s = slides[index];
  const cilium = s.kind === "title" || s.kind === "topology";
  return (
    <article
      className={`slide reference-slide slide-${s.kind} ${cilium ? "cilium-template" : "cf-template"}`}
      aria-label={`Folie ${index + 1}: ${s.title}`}
    >
      {s.kind === "title" ? (
        <>
          <div className="reference-masthead">
            <strong>eBPF</strong>
            <span>Linux-Netzwerke</span>
            <div>
              Grundlagen <span>Praxis</span> Diskussion
            </div>
          </div>
          <div className="cilium-hero">
            <div>
              <h1>
                eBPF im
                <br />
                Linux-Netzwerk
              </h1>
              <p>
                Programme im Kernel ausführen. Verbindungen mit Cilium
                verteilen. Mit Hubble sehen, was tatsächlich passiert.
              </p>
              <div className="cilium-hero-links">
                <a
                  href="https://ebpf.io/what-is-ebpf/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Grundlagen verstehen
                </a>
                <a
                  href="http://127.0.0.1:12000/?namespace=ebpf-talk"
                  target="_blank"
                  rel="noreferrer"
                >
                  Linux-Labor öffnen
                </a>
              </div>
            </div>
            <KernelIllustration />
          </div>
          <div className="cilium-outline">
            <span>
              01 <strong>eBPF</strong> Hook, Verifier, Maps
            </span>
            <span>
              02 <strong>Cilium</strong> Service & Policy
            </span>
            <span>
              03 <strong>Hubble</strong> Flows & Ursachen
            </span>
          </div>
        </>
      ) : s.kind === "topology" ? (
        <>
          <div className="reference-masthead">
            <strong>eBPF</strong>
            <span>Praxis / Observability</span>
          </div>
          <div className="cilium-usecase">
            <div>
              <span className="cilium-category">OBSERVABILITY</span>
              <h1>Unser Linux-Labor</h1>
              <p className="cilium-tagline">
                Ein Service. Zwei Python-Backends.
                <br />
                Zwei Clients mit unterschiedlichen Labels.
              </p>
              <h2>Was zeigt Hubble?</h2>
              <p>
                Die Service Map entsteht aus beobachteten Verbindungen. Ein Flow
                verrät Quelle, Ziel und Entscheidung. Für HTTP-Details
                aktivieren wir L7-Regeln – dabei ist Envoy im Datenpfad.
              </p>
            </div>
            <img
              src="./vendor/cilium/k8s-bee.png"
              alt="Original Cilium Kubernetes Bee"
            />
          </div>
          <div className="lab-topology-text">
            <code>client-a · role=trusted</code>
            <code>web:8080 → zwei Pods</code>
            <code>client-b · role=guest</code>
          </div>
        </>
      ) : (
        <>
          <header className="slide-header">
            <div className="cf-breadcrumb">
              eBPF <span>/</span> {s.section} <span>/</span> {s.short}
            </div>
            <h1>{s.title}</h1>
            <div className="cf-page-meta">
              Linux-Netzwerke <span>│</span>{" "}
              {s.kind === "lab"
                ? "Ausführbarer Laborversuch"
                : "Technische Grundlagen"}{" "}
              <span>│</span> {s.time}
            </div>
          </header>
          <div className="slide-body">
            {s.kind === "definition" && (
              <div className="docs-columns">
                <div className="docs-prose">
                  <p>
                    eBPF-Programme erweitern den Linux-Kernel an definierten
                    Hooks. Der Kernel prüft den Bytecode vor der Ausführung.
                  </p>
                  <h2>Ereignis statt eigener Hauptschleife</h2>
                  <p>
                    Ein Paket trifft ein oder eine Verbindung wird aufgebaut:
                    Der Hook ruft das passende Programm mit seinem Kontext auf.
                  </p>
                  <h2>Userspace bleibt Userspace</h2>
                  <p>
                    Python steuert unsere Anwendung. Cilium lädt die
                    eBPF-Programme. Python selbst läuft hier nicht im Kernel.
                  </p>
                </div>
                <aside className="docs-toc">
                  <h2>Die Bausteine</h2>
                  <p className="active">Hook</p>
                  <p>Verifier</p>
                  <p>JIT</p>
                  <p>Maps</p>
                  <img
                    src="./vendor/cilium/hero-illustration.svg"
                    alt="Cilium Architektur"
                  />
                </aside>
              </div>
            )}
            {s.kind === "lifecycle" && (
              <div className="docs-prose">
                <p>
                  Das Laden und die spätere Ausführung sind zwei getrennte
                  Vorgänge.
                </p>
                <div className="cf-steps">
                  <section>
                    <h2>1. Kompilieren und laden</h2>
                    <p>Ein Loader übergibt eBPF-Bytecode an den Kernel.</p>
                  </section>
                  <section>
                    <h2>2. Prüfen und übersetzen</h2>
                    <p>
                      Der Verifier prüft die Zulässigkeit. Der JIT erzeugt auf
                      unterstützten Systemen Maschinencode.
                    </p>
                  </section>
                  <section>
                    <h2>3. An den Hook binden</h2>
                    <p>
                      Ab jetzt führt ein passendes Ereignis das Programm aus.
                      Ein neues Paket benötigt kein erneutes Laden.
                    </p>
                  </section>
                </div>
                <div className="cf-note">
                  <strong>Im Labor</strong>
                  <p>
                    Cilium übernimmt diese Schritte. Wir verändern die Regeln
                    und beobachten den resultierenden Datenpfad.
                  </p>
                </div>
              </div>
            )}
            {s.kind === "verifier" && (
              <div className="docs-columns figure-columns">
                <div className="docs-prose">
                  <h2>Verifier</h2>
                  <p>
                    Prüft unter anderem Speicherzugriffe und den Programmablauf.
                    Vor einem Headerzugriff müssen die Paketgrenzen nachgewiesen
                    sein.
                  </p>
                  <h2>JIT</h2>
                  <p>
                    Übersetzt zulässigen Bytecode in Maschinencode für die
                    jeweilige CPU.
                  </p>
                  <div className="cf-note">
                    <strong>Eine falsche Regel bleibt möglich</strong>
                    <p>
                      Die Absicht „Client B sperren“ kennt der Verifier nicht.
                      Ob die Regel fachlich passt, zeigt der Versuch.
                    </p>
                  </div>
                </div>
                <Figure
                  file="bpf-jit.png"
                  caption="BPF-Bytecode → JIT → Maschinencode"
                />
              </div>
            )}
            {s.kind === "maps" && (
              <div className="docs-columns figure-columns">
                <Figure
                  file="bpf-map.png"
                  caption="Maps verbinden Userspace und BPF-Programme"
                />
                <div className="docs-prose">
                  <h2>Gemeinsame Datenstrukturen</h2>
                  <p>
                    Userspace und BPF-Programme lesen und schreiben Daten in
                    Maps. Welche Zugriffe möglich sind, hängt vom Map-Typ ab.
                  </p>
                  <h2>Was wir nachher auslesen</h2>
                  <ul>
                    <li>Service-IP und zugehörige Backends</li>
                    <li>Endpoint-Identitäten</li>
                    <li>Policy-Einträge für erlaubte Quellen</li>
                  </ul>
                  <p>
                    <code>cilium-dbg bpf lb list</code>
                    <br />
                    zeigt die tatsächliche Service-Konfiguration.
                  </p>
                </div>
              </div>
            )}
            {s.kind === "hooks" && (
              <>
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Hook</th>
                      <th>Wann / welcher Kontext?</th>
                      <th>Typische Aufgabe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "XDP",
                        "Eingehendes Paket im frühen Empfangspfad",
                        "PASS / DROP, z. B. DDoS-Abwehr",
                      ],
                      [
                        "TC",
                        "Paket am Netzwerkinterface",
                        "Weiterleitung und Netzwerkregeln",
                      ],
                      [
                        "Socket-Hooks",
                        "z. B. beim Verbindungsaufbau",
                        "Service auf Backend umsetzen",
                      ],
                      [
                        "Tracepoints",
                        "Definierte Kernelereignisse",
                        "Verbindungen und Zustände beobachten",
                      ],
                    ].map((r) => (
                      <tr key={r[0]}>
                        {r.map((v, i) =>
                          i === 0 ? (
                            <th key={i}>
                              <code>{v}</code>
                            </th>
                          ) : (
                            <td key={i}>{v}</td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="cf-note">
                  <strong>Den Einsatzpunkt benennen</strong>
                  <p>
                    Eine Cilium-Netzwerkregel ist nicht automatisch ein
                    XDP-Filter. Unser Labor zeigt Ciliums Service- und
                    Policy-Datenpfad.
                  </p>
                </div>
              </>
            )}
            {s.kind === "companies" && (
              <>
                <p className="docs-intro">
                  Vier dokumentierte Systeme, vier konkrete Netzwerkaufgaben.
                </p>
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Unternehmen</th>
                      <th>System</th>
                      <th>Einsatz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "Meta",
                        "Katran",
                        "Netzwerk-Lastverteilung mit eBPF/XDP",
                        2,
                      ],
                      [
                        "Netflix",
                        "Flow Exporter",
                        "TCP-Flows über Tracepoints erfassen",
                        3,
                      ],
                      [
                        "Microsoft Azure",
                        "Azure CNI / Cilium",
                        "Kubernetes-Datenpfad und Netzwerkrichtlinien",
                        8,
                      ],
                      [
                        "Cloudflare",
                        "L4Drop",
                        "Pakete zur DDoS-Abwehr verwerfen",
                        7,
                      ],
                    ].map(([a, b, c, id]) => (
                      <tr key={String(a)}>
                        <th>{a}</th>
                        <td>{b}</td>
                        <td>
                          {c}{" "}
                          <a
                            href={sources[Number(id)][1]}
                            target="_blank"
                            rel="noreferrer"
                          >
                            [{Number(id) + 1}] ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {s.kind === "lab" && <LabSlide index={index} state={lab} />}
            {s.kind === "results" && (
              <>
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Behauptung</th>
                      <th>Benötigter Nachweis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "Dieser Pod hat geantwortet",
                        "HTTP-Antwort + Request-ID im Backend-Log",
                      ],
                      [
                        "Neue Verbindungen ermöglichen neue Backend-Auswahl",
                        "Clientcode und tatsächlich gelieferte Backend-Namen",
                      ],
                      [
                        "Client B wird durch die Policy gesperrt",
                        "Timeout + Policy-Drop; Client A weiterhin erfolgreich",
                      ],
                      [
                        "Die Regel wurde im Datenpfad umgesetzt",
                        "Endpoint-Identitäten und BPF-Policy-Map",
                      ],
                      [
                        "Der XDP-Portfilter wirkt selektiv",
                        "9090 Timeout + ΔDROP; 8080 HTTP 200 + ΔPASS; danach 9090 wieder HTTP 200",
                      ],
                    ].map((r) => (
                      <tr key={r[0]}>
                        <th>{r[0]}</th>
                        <td>{r[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="docs-intro">
                  Requests, TCP-Verbindungen und Pakete sind unterschiedliche
                  Messgrößen.
                </p>
              </>
            )}
            {s.kind === "questions" && (
              <ol className="question-list">
                {questions.map(([q, a], i) => (
                  <li key={q}>
                    <div>
                      <span>{i + 1}</span>
                      <h2>{q}</h2>
                    </div>
                    {answers.includes(i) && <p>{a}</p>}
                  </li>
                ))}
              </ol>
            )}
            {s.kind === "sources" && (
              <>
                <ol className="source-list">
                  {sources.map(([title, url], i) => (
                    <li key={url}>
                      <span>[{i + 1}]</span>
                      <a href={url} target="_blank" rel="noreferrer">
                        {title}
                      </a>
                    </li>
                  ))}
                </ol>
                <p className="asset-attribution">
                  Grafiken: Cilium Authors. Gestaltung nach Cilium und
                  Cloudflare Docs. Quellen und Lizenzen:{" "}
                  <a
                    href="./vendor/ATTRIBUTION.md"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ATTRIBUTION.md ↗
                  </a>
                </p>
              </>
            )}
          </div>
        </>
      )}
      <footer className="slide-footer">
        <span>
          {cilium
            ? "Grafiken: Cilium Authors · cilium.io"
            : "eBPF · Linux-Netzwerke"}
        </span>
        <span>
          {s.sourceIds.map((i) => (
            <a key={i} href={sources[i][1]} target="_blank" rel="noreferrer">
              [{i + 1}]
            </a>
          ))}
        </span>
        <span>
          {String(index + 1).padStart(2, "0")} / {slides.length}
        </span>
      </footer>
    </article>
  );
}
