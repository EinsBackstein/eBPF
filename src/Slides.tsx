import { slides, sources, questions } from "./deck";
import { LabSlide, type LabState } from "./Lab";
import { KernelIllustration } from "./Illustrations";

import { Fundamentals } from "./Fundamentals";
import { Organisations } from "./Organisations";

export function SlideContent({
  index,
  lab,
  answers,
  onLabChange,
}: {
  index: number;
  lab: LabState;
  answers: number[];
  onLabChange?: (patch: Partial<LabState>) => void;
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
          </header>
          <div className="slide-body">
            {["definition", "hooks", "verifier", "jit", "maps"].includes(
              s.kind,
            ) && <Fundamentals topic={s.kind} />}
            {s.kind === "companies" && <Organisations />}
            {s.kind === "lab" && (
              <LabSlide index={index} state={lab} onChange={onLabChange} />
            )}
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
                  Grafiken: Cilium Authors und eBPF.io authors. Gestaltung nach
                  Cilium, Cloudflare Docs und ebpf.io. Quellen und Lizenzen:{" "}
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
        <span>eBPF · Linux-Netzwerke</span>
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
