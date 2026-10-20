import { slides, sources, questions } from "./deck";
import { LabSlide, type LabState } from "./Lab";
import { KernelIllustration } from "./Illustrations";

import { Benefits } from "./Benefits";
import { Fundamentals } from "./Fundamentals";
import { Organisations } from "./Organisations";
import { LabTopology } from "./KernelStory";

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
  const cilium = s.kind === "title";
  return (
    <article
      className={`slide reference-slide slide-${s.kind} ${cilium ? "cilium-template" : "cf-template"}`}
      aria-label={`Folie ${index + 1}: ${s.title}`}
    >
      {s.kind === "title" ? (
        <>
          <div className="reference-masthead">
            <strong>eBPF</strong>
            <div>
              Grundlagen <span>Praxis</span> Diskussion
            </div>
          </div>
          <div className="cilium-hero">
            <div>
              <h1>
                eBPF:
                <br />
                Netzwerk in modernen Linux Applikationen
              </h1>
              <p>
                Netzwerkverarbeitung und Systembeobachtung mit Programmen im Linux-Kernel.
              </p>
            </div>
            <KernelIllustration />
          </div>
          <div className="cilium-outline">
            <span>
              01 <strong>Was ist und wie funktioniert eBPF</strong>
            </span>
            <span>
              02 <strong>eBPF Lab</strong>
            </span>
          </div>
        </>
      ) : s.kind === "topology" ? (
        <>
          <header className="slide-header">
            <div className="cf-breadcrumb">
              eBPF <span>/</span> {s.section} <span>/</span> {s.short}
            </div>
            <h1>{s.title}</h1>
          </header>
          <div className="slide-body topology-body">
            <LabTopology />
            <div className="topology-notes">
              <div>
                <strong>Umgebung</strong>
                <p>
                  Ein Dienst · zwei Server · zwei Clients
                </p>
              </div>
              <div>
                <strong>Cilium</strong>
                <p>
                  Cilium: fertige eBPF-Werkzeuge für Verteilung und Zugriff
                </p>
              </div>
              <div>
                <strong>Unser Paketfilter</strong>
                <p>
                  Separates Testnetz: zwei Ports · eine veränderbare Regel
                </p>
              </div>
            </div>
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
          <div className={`slide-body body-${s.kind}`}>
            {s.kind === "benefits" && <Benefits />}
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
                      <th>Versuch</th>
                      <th>Beobachtung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "Gezielt filtern",
                        "9090: Timeout + DROP ↑ · 8080: HTTP 200",
                      ],
                      [
                        "Regel ändern",
                        "Map: 0 ↔ 9090 · gleiche Programm-ID",
                      ],
                      [
                        "Verbindungen verteilen",
                        "Keep-alive: derselbe Server · neue Verbindung: neue Auswahl möglich",
                      ],
                      [
                        "Zugriff vor HTTP prüfen",
                        "B: Timeout + POLICY_DENIED · A: weiterhin erreichbar",
                      ],
                      [
                        "Im Kernel nachsehen",
                        "Service · Backends · Regeln in BPF-Maps",
                      ],
                    ].map((r) => (
                      <tr key={r[0]}>
                        <th>{r[0]}</th>
                        <td>{r[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {s.kind === "questions" && (
              <ol className="question-list">
                {questions.map(([q, a], i) => (
                  <li key={q} style={{ animationDelay: `${i * 100}ms` }}>
                    <div>
                      <span>{i + 1}</span>
                      <h2>{q}</h2>
                    </div>
                    {answers.includes(i) && <p className="answer-reveal">{a}</p>}
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
              </>
            )}
          </div>
        </>
      )}
      <footer className="slide-footer">
        <span>eBPF · Netzwerk in modernen Linux Applikationen</span>
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
