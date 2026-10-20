const topics = [
  ["definition", "Was ist eBPF?"],
  ["hooks", "Hooks"],
  ["verifier", "Verifier"],
  ["jit", "JIT"],
  ["maps", "Maps"],
];
export function Fundamentals({ topic }: { topic: string }) {
  return (
    <div className="docs-columns fundamentals">
      <div className="docs-prose">
        {topic === "definition" && (
          <>
            <p>
              Mit eBPF lassen sich kleine Programme im Linux-Kernel ausführen –
              ohne dessen Quellcode für jede Aufgabe zu ändern.
            </p>
            <h2>Auf Ereignisse reagieren</h2>
            <p>
              Ein Paket trifft ein, eine Verbindung entsteht oder ein Prozess
              startet: An solchen Ereignissen kann ein eBPF-Programm arbeiten.
            </p>
            <h2>Beobachten oder eingreifen</h2>
            <p>
              Zum Beispiel Verbindungen messen, Pakete filtern oder ein Ziel für
              Netzwerkverkehr auswählen.
            </p>
          </>
        )}
        {topic === "hooks" && (
          <>
            <p>
              Ein Hook ist ein definierter Einsatzpunkt. Er bestimmt,{" "}
              <strong>wann</strong> ein Programm läuft und{" "}
              <strong>welche Daten</strong> es sieht.
            </p>
            <dl className="hook-list">
              <div>
                <dt>XDP</dt>
                <dd>
                  Früh im Paketempfang filtern – etwa unerwünschte Pakete
                  verwerfen.
                </dd>
              </div>
              <div>
                <dt>TC</dt>
                <dd>
                  Ein- und ausgehende Pakete am Interface prüfen, verändern oder
                  weiterleiten.
                </dd>
              </div>
              <div>
                <dt>Socket-Hooks</dt>
                <dd>
                  Zum Beispiel bei <code>connect()</code> das Verbindungsziel
                  prüfen oder umschreiben.
                </dd>
              </div>
              <div>
                <dt>Tracepoints</dt>
                <dd>
                  Kernelereignisse beobachten – etwa TCP-Zustandswechsel oder
                  Prozessstarts.
                </dd>
              </div>
            </dl>
          </>
        )}
        {topic === "verifier" && (
          <>
            <p>
              Der Verifier prüft ein eBPF-Programm <strong>beim Laden</strong>.
              Erst nach erfolgreicher Prüfung darf es ausgeführt werden.
            </p>
            <h2>Sind die Zugriffe zulässig?</h2>
            <p>
              Vor dem Lesen eines Paket-Headers muss das Programm sicherstellen,
              dass die benötigten Bytes vorhanden sind.
            </p>
            <div
              className="simple-flow"
              aria-label="Bytecode wird geprüft und dann zugelassen oder abgelehnt"
            >
              <span>eBPF-Bytecode</span>
              <b aria-hidden="true">→</b>
              <span className="focus">Verifier</span>
              <b aria-hidden="true">→</b>
              <span>
                Zulassen
                <br />
                oder ablehnen
              </span>
            </div>
            <p className="fundamental-caption">
              Ob die Filterregel fachlich richtig ist, muss man trotzdem testen.
            </p>
          </>
        )}
        {topic === "jit" && (
          <>
            <p>
              <strong>JIT</strong> steht für Just-in-Time-Kompilierung. Der
              Kernel übersetzt geprüften eBPF-Bytecode in Maschinencode für die
              CPU.
            </p>
            <h2>Übersetzen statt jede Anweisung interpretieren</h2>
            <p>
              Die Übersetzung erfolgt beim Laden. Bei einem späteren Ereignis
              kann die CPU den erzeugten Code direkt ausführen.
            </p>
            <div
              className="simple-flow"
              aria-label="Geprüfter Bytecode wird vom JIT in CPU-Maschinencode übersetzt"
            >
              <span>
                Geprüfter
                <br />
                Bytecode
              </span>
              <b aria-hidden="true">→</b>
              <span className="focus">JIT</span>
              <b aria-hidden="true">→</b>
              <span>
                CPU-
                <br />
                Maschinencode
              </span>
            </div>
            <p className="fundamental-caption">
              Der JIT beschleunigt die Ausführung. Die Zulässigkeit prüft zuvor
              der Verifier.
            </p>
          </>
        )}
        {topic === "maps" && (
          <>
            <p>
              Maps speichern Daten, die über einen einzelnen Programmaufruf
              hinaus erhalten bleiben:{" "}
              <strong>Regeln, Zustand und Messwerte.</strong>
            </p>
            <h2>Daten zwischen Userspace und Kernel austauschen</h2>
            <p>
              Ein Userspace-Programm kann eine Regel ändern. Das eBPF-Programm
              liest sie beim nächsten Ereignis und aktualisiert beispielsweise
              einen Zähler.
            </p>
            <div
              className="simple-flow map-flow"
              aria-label="Python und eBPF greifen auf eine gemeinsame Map zu"
            >
              <span>
                Python
                <br />
                <small>Userspace</small>
              </span>
              <b aria-hidden="true">↔</b>
              <span className="focus">
                Map
                <br />
                <small>Port: 9090</small>
              </span>
              <b aria-hidden="true">↔</b>
              <span>
                eBPF
                <br />
                <small>Kernel</small>
              </span>
            </div>
            <p className="fundamental-caption">
              Die Daten ändern sich; das Programm muss dafür nicht neu geladen
              werden.
            </p>
          </>
        )}
      </div>
      <aside className="docs-toc" aria-label="Grundlagen – aktuelles Thema">
        <h2>Die Bausteine</h2>
        {topics.map(([id, label]) => (
          <p
            key={id}
            className={topic === id ? "active" : ""}
            aria-current={topic === id ? "step" : undefined}
          >
            {label}
          </p>
        ))}
      </aside>
    </div>
  );
}
