export function WhyEBPF() {
  return <div className="why-ebpf">
    <p className="keynote-lead">Der Webdienst antwortet nicht. Wo bleibt die Verbindung?</p>
    <div className="why-options">
      <section className="why-option muted"><span>01 · Anwendung</span><h2>Das Log bleibt leer</h2><p>Keine Anfrage angekommen</p><small>Ursache noch unbekannt</small></section>
      <section className="why-option muted"><span>02 · Kernel</span><h2>Hier fällt die Entscheidung</h2><p>Verbindung · Ziel · Netzwerkregel</p><small>Zentraler Vermittler zur Hardware</small></section>
      <section className="why-option focus"><span>03 · eBPF</span><h2>Im Kernel nachsehen</h2><p>Verworfene Pakete erkennen</p><small>Zur Laufzeit ergänzen</small></section>
    </div>
    <div className="why-analogy"><div><strong>Vergleich mit JavaScript</strong><p>JavaScript ergänzt den Browser. eBPF ergänzt den Kernel.</p></div><div><strong>Vor dem Laden</strong><p>Der Verifier prüft den Programmcode.</p></div></div>
  </div>;
}

const stages = [
  {
    index: "1",
    name: "XDP",
    place: "an der Netzwerkkarte",
    text: "Das Paket ist eben angekommen. Verwerfen, weiterleiten oder zählen, bevor Linux viel Arbeit investiert.",
    example: "Einsatz: Angriffsverkehr verwerfen, bevor er den Stack erreicht.",
    tag: "Türsteher an der Haustür",
    focus: true,
  },
  {
    index: "2",
    name: "TC",
    place: "am Netzwerk-Interface",
    text: "Ein- und ausgehende Pakete prüfen, verändern oder an ein anderes Ziel umleiten.",
    example: "Einsatz: Verkehr zwischen Containern regeln, Pakete umleiten oder Felder im Header ändern.",
    tag: "Kontrolle im Gang",
  },
  {
    index: "3",
    name: "Socket",
    place: "kurz vor der Anwendung",
    text: "Beim Verbindungsaufbau das Ziel prüfen oder umschreiben, statt jedes Paket einzeln anzufassen.",
    example: "Einsatz: Beim Verbindungsaufbau ein Backend auswählen oder eine Adresse umschreiben.",
    tag: "Die Wohnungstür",
  },
  {
    index: "4",
    name: "Anwendung",
    place: "im Userspace",
    text: "Hier kommt nur an, was durchgelassen wurde. Kein eBPF-Programm, sondern das Ziel der Reise.",
    example: "Ergebnis: Der Webserver sieht nur erlaubte Anfragen. Was vorher verworfen wurde, existiert für ihn nicht.",
    tag: "Im Wohnzimmer",
    muted: true,
  },
];

export function PacketJourney() {
  return (
    <div className="packet-journey">
      <ol className="journey-rail" aria-label="Stationen eines Pakets">
        {stages.map((s) => (
          <li
            key={s.name}
            className={`journey-stage${s.focus ? " focus" : ""}${s.muted ? " muted" : ""}`}
          >
            <span className="journey-index">{s.index}</span>
            <small>{s.place}</small>
            <h2>{s.name}</h2>
            <p>{s.text}</p>
            <p className="journey-example">{s.example}</p>
            <span className="journey-tag">{s.tag}</span>
          </li>
        ))}
      </ol>
      <div className="journey-side">
        <strong>Daneben: Tracepoints und kprobes</strong>
        <p>
          Sie hängen nicht im Paketpfad. Sie melden Kernel-Ereignisse wie einen
          Prozessstart, einen Dateizugriff oder einen TCP-Zustandswechsel. Gut
          zum Beobachten, nicht zum Filtern von Paketen.
        </p>
      </div>
    </div>
  );
}

export function LabTopology() {
  return (
    <div className="lab-map">
      <div className="lab-map-column">
        <span className="lab-map-caption">Wer fragt?</span>
        <div className="lab-node client trusted">
          <strong>client-a</strong>
          <small>role=trusted</small>
        </div>
        <div className="lab-node client guest">
          <strong>client-b</strong>
          <small>role=guest</small>
        </div>
      </div>
      <div className="lab-map-connector" aria-hidden="true">
        →
      </div>
      <div className="lab-map-column middle">
        <span className="lab-map-caption">Wer wählt?</span>
        <div className="lab-node service">
          <strong>web:8080</strong>
          <small>eine gemeinsame Adresse</small>
        </div>
        <span className="lab-map-note">Der Kernel entscheidet</span>
      </div>
      <div className="lab-map-connector" aria-hidden="true">
        →
      </div>
      <div className="lab-map-column">
        <span className="lab-map-caption">Wer antwortet?</span>
        <div className="lab-node backend">
          <strong>backend-a</strong>
          <small>Python-Prozess</small>
        </div>
        <div className="lab-node backend">
          <strong>backend-b</strong>
          <small>Python-Prozess</small>
        </div>
      </div>
    </div>
  );
}
