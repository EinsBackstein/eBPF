export const sources = [
  ["eBPF · Grundlagen", "https://ebpf.io/what-is-ebpf/"],
  ["Linux · eBPF Verifier", "https://docs.kernel.org/bpf/verifier.html"],
  [
    "Meta · Katran",
    "https://engineering.fb.com/2018/05/22/open-source/open-sourcing-katran-a-scalable-network-load-balancer/",
  ],
  [
    "Netflix · Flow Logs",
    "https://netflixtechblog.com/how-netflix-uses-ebpf-flow-logs-at-scale-for-network-insight-e3ea997dca96",
  ],
  [
    "Cilium · Hubble",
    "https://docs.cilium.io/en/stable/observability/hubble/index.html",
  ],
  [
    "Cilium · Socket Load Balancing",
    "https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/",
  ],
  ["XDP · Hands-on Tutorial", "https://github.com/xdp-project/xdp-tutorial"],
  [
    "Cloudflare · DDoS-Abwehr",
    "https://blog.cloudflare.com/how-cloudflare-auto-mitigated-world-record-3-8-tbps-ddos-attack/",
  ],
  [
    "Microsoft · Azure CNI / Cilium",
    "https://learn.microsoft.com/en-us/azure/aks/network-policy-best-practices",
  ],
];
export type Slide = {
  title: string;
  short: string;
  section: string;
  time: string;
  label: string;
  description: string;
  notes: string;
  kind: string;
  sourceIds: number[];
  items?: [string, string][];
};
export const slides: Slide[] = [
  {
    title: "Kleine Programme. Große Wirkung.",
    short: "Inside the kernel",
    section: "Einstieg",
    time: "01:00",
    label: "LINUX NETWORKING, NEU GEDACHT",
    description:
      "Netzwerkverkehr beobachten, verteilen und absichern. Direkt dort, wo er entsteht.",
    notes:
      "Einstieg: Ein Webdienst ist langsam oder nicht erreichbar. Wer spricht mit wem? Welcher Server antwortet? Wer blockiert die Verbindung? Diese drei Fragen ziehen sich durch den Vortrag. eBPF gibt uns Sichtbarkeit und Entscheidungsmöglichkeiten direkt an Ereignissen im Linux-Kernel.",
    kind: "intro",
    sourceIds: [0],
  },
  {
    title: "Was wäre, wenn der Kernel erweiterbar wäre?",
    short: "Was ist eBPF?",
    section: "Grundlagen",
    time: "02:00",
    label: "01 / DIE GRUNDIDEE",
    description:
      "Eingeschränkte Programme reagieren auf definierte Ereignisse im Linux-Kernel — ohne dessen Quellcode für jede Aufgabe zu ändern.",
    notes:
      "Userspace: Dort laufen Browser, Python und unsere Anwendung. Der Kernel vermittelt zwischen Anwendungen und Hardware. eBPF-Programme laufen an definierten Hooks. Die Technologie stammt aus der Paketfilterung, ist heute aber breiter einsetzbar. Normales Python oder TypeScript läuft dabei nicht im Kernel.",
    kind: "concept",
    sourceIds: [0],
    items: [
      ["Userspace", "Anwendungen, Konfiguration und Auswertung."],
      ["eBPF", "Kleine, ereignisgesteuerte Programme."],
      ["Linux-Kernel", "Definierte Hooks statt beliebiger Eingriffe."],
    ],
  },
  {
    title: "Vom Programm zum Ereignis.",
    short: "Hooks & Lebenszyklus",
    section: "Grundlagen",
    time: "02:00",
    label: "02 / DER LEBENSZYKLUS",
    description:
      "Ein Programm wird vorbereitet, geprüft und an einen Hook gebunden. Erst das passende Ereignis löst es aus.",
    notes:
      "Den Ablauf einmal von links nach rechts erklären. Bytecode laden, Verifier-Prüfung, gegebenenfalls JIT-Übersetzung, Hook anbinden. Ein eintreffendes Paket oder ein neuer Verbindungsaufbau kann die Ausführung auslösen. Der Hook bestimmt den verfügbaren Kontext.",
    kind: "lifecycle",
    sourceIds: [0, 1],
  },
  {
    title: "Geprüft heißt nicht unfehlbar.",
    short: "Verifier, JIT & Grenzen",
    section: "Grundlagen",
    time: "02:00",
    label: "03 / SICHERHEIT & LAUFZEIT",
    description:
      "Der Verifier prüft die Zulässigkeit. Der JIT übersetzt auf unterstützten Systemen in Maschinencode.",
    notes:
      "Beispiel: Vor dem Lesen eines Paketheaders muss das Programm nachweisen, dass die Daten vorhanden sind. Ein zulässiges Programm kann trotzdem den falschen Port sperren. Der Verifier prüft keine fachliche Absicht. Overhead, Berechtigungen und unterstützte Kernelmerkmale bleiben wichtig.",
    kind: "cards",
    sourceIds: [0, 1],
    items: [
      [
        "Verifier",
        "Prüft unter anderem Speicherzugriffe und den Programmablauf.",
      ],
      ["JIT", "Übersetzt Bytecode auf unterstützten Systemen in nativen Code."],
      [
        "Grenzen",
        "Falsche Regeln, Laufzeitaufwand und Kernelabhängigkeiten bleiben.",
      ],
    ],
  },
  {
    title: "Maps verbinden beide Welten.",
    short: "Maps & Userspace",
    section: "Grundlagen",
    time: "02:00",
    label: "04 / GEMEINSAMER ZUSTAND",
    description:
      "Konfiguration hinein. Messwerte heraus. Maps halten Daten für eBPF-Programme und Werkzeuge im Userspace.",
    notes:
      "Eine Map ist zum Beispiel eine Backend-Tabelle, eine erlaubte Quelle oder ein Aktionszähler. Python kann über Werkzeuge und APIs konfigurieren und auswerten. Das Kernelprogramm verarbeitet das Ereignis. Diese Trennung ist in unserer Praxis wichtig.",
    kind: "maps",
    sourceIds: [0],
    items: [
      ["Konfiguration", "Welche Ports sind erlaubt?"],
      ["Zustand", "Welches Backend gehört zur Verbindung?"],
      ["Messwerte", "Wie oft wurde PASS oder DROP entschieden?"],
    ],
  },
  {
    title: "Der Hook macht den Unterschied.",
    short: "Wo eBPF arbeitet",
    section: "Grundlagen",
    time: "02:00",
    label: "05 / EINSATZPUNKTE",
    description:
      "Gleiche Technologie. Unterschiedlicher Zeitpunkt, Kontext und Handlungsspielraum.",
    notes:
      "Tracepoints beobachten Ereignisse. Socket-Hooks können an Verbindungsentscheidungen beteiligt sein. TC verarbeitet Pakete. Native XDP läuft früh im Treiberpfad; Generic XDP später auf Socket Buffers. Cilium ist nicht gleich XDP. Unsere Demo verwendet ein separates Modell für den XDP-Portfilter.",
    kind: "hooks",
    sourceIds: [0, 5, 6],
    items: [
      ["XDP", "Früh im Empfangspfad · PASS / DROP"],
      ["TC", "Paketverarbeitung am Netzwerkinterface"],
      ["Socket", "Entscheidungen rund um Verbindungen"],
      ["Tracepoint", "Ereignisse beobachten und auswerten"],
    ],
  },
  {
    title: "Aus dem Kernel. In die Praxis.",
    short: "eBPF in Produktion",
    section: "Einsatz",
    time: "03:00",
    label: "06 / ECHTE EINSATZGEBIETE",
    description:
      "Große Unternehmen nutzen eBPF für konkrete Aufgaben im Netzwerkbetrieb.",
    notes:
      "Keine reine Logosammlung: Meta nutzt Katran für Lastverteilung. Netflix dokumentiert Flow Exporter für TCP-Flows. Azure CNI powered by Cilium stellt einen eBPF-Datenpfad bereit. Cloudflare dokumentiert L4Drop für Angriffsabwehr. Es geht um diese Systeme, nicht um pauschale Aussagen über die gesamte Infrastruktur.",
    kind: "companies",
    sourceIds: [2, 3, 7, 8],
    items: [
      ["Meta", "Katran · Lastverteilung mit eBPF und XDP"],
      ["Netflix", "Flow Exporter · TCP-Verbindungen verstehen"],
      ["Microsoft Azure", "Cilium-Datenpfad · Netzwerk und Policies"],
      ["Cloudflare", "L4Drop · Angriffsverkehr früh verwerfen"],
    ],
  },
  {
    title: "Ein Dienst. Drei Perspektiven.",
    short: "Unser Labor",
    section: "Praxis",
    time: "01:00",
    label: "07 / DER VERSUCHSAUFBAU",
    description:
      "Zwei Clients, eine Service-Adresse und zwei Python-Backends. Beobachten, verteilen, absichern.",
    notes:
      "Der geplante echte Aufbau: k3d in einer Linux-VM, Cilium und Hubble. Clients im Cluster sprechen den internen Service an. Python erzeugt Requests und zeigt Backend-Namen. Die Website simuliert zunächst die Effekte; sie führt keine eBPF-Programme aus. Den vorbereiteten Linux-Aufbau separat zeigen.",
    kind: "topology",
    sourceIds: [4, 5],
  },
  {
    title: "Wer spricht mit wem?",
    short: "A · Beobachten",
    section: "Praxis",
    time: "03:00",
    label: "PRAXIS A / OBSERVABILITY",
    description:
      "Erzeuge neue Verbindungen und verfolge ihren Weg vom Client zum Backend.",
    notes:
      "Simulation deutlich benennen. Im echten Labor Hubble-Service-Map und Flowdetails zeigen. Backend-Antworten identifizieren den bedienenden Prozess. Die Service-Map muss dafür nicht jedes Backend getrennt darstellen. Beobachtete Requests sind nicht gleich Paketzähler.",
    kind: "lab",
    sourceIds: [4],
  },
  {
    title: "Eine Adresse. Mehrere Backends.",
    short: "B · Verteilen",
    section: "Praxis",
    time: "04:00",
    label: "PRAXIS B / LOAD BALANCING",
    description:
      "Neue TCP-Verbindungen können bei unterschiedlichen Backends landen. Eine kleine Stichprobe muss nicht 50:50 sein.",
    notes:
      "Im echten Versuch neue TCP-Verbindungen erzeugen und die Backend-Namen zählen. Die Simulation wählt beispielhaft zufällig. HTTP-Anfragen auf einer bestehenden Verbindung bedeuten keine neue Backend-Auswahl. Ciliums Socket-LB und XDP-Beschleunigung unterscheiden.",
    kind: "lab",
    sourceIds: [5],
  },
  {
    title: "Zugriff ist eine Entscheidung.",
    short: "C · Absichern",
    section: "Praxis",
    time: "05:00",
    label: "PRAXIS C / NETWORK POLICY",
    description:
      "Erlaube den vorgesehenen Client. Blockiere den zweiten. Prüfe anschließend die Wiederherstellung.",
    notes:
      "Policy aktivieren und neue Verbindungen beider Clients testen. Im echten Labor auf bestätigte Policy-Übernahme warten. Hubble-Drop mit Policy-Grund zeigen. Danach Regel zurücknehmen und beide Clients erneut testen. Das ist Netzwerksicherheit, keine Anmeldung der HTTP-Anwendung.",
    kind: "lab",
    sourceIds: [4, 5],
  },
  {
    title: "Entscheiden, bevor es weitergeht.",
    short: "D · XDP-Paketfilter",
    section: "Praxis",
    time: "03:00",
    label: "PRAXIS D / XDP IM DETAIL",
    description:
      "TCP/9090 blockieren. TCP/8080 weiterreichen. Jede Entscheidung in den Maps nachvollziehen.",
    notes:
      "Interaktive Browser-Simulation: Port wählen, Filter aktivieren, Pakete senden und Zähler ansehen. Im geplanten echten Versuch separates veth-Testnetz in Linux, Generic-/SKB-XDP und Maps über Python/bpftool. XDP-Drops dieses Versuchs sind keine Hubble-Policy-Drops. Die einfache Regel ist Pseudocode und lässt Parser-Prüfungen aus.",
    kind: "lab",
    sourceIds: [6],
  },
  {
    title: "Was der Versuch wirklich zeigt.",
    short: "Auswertung & Grenzen",
    section: "Abschluss",
    time: "01:00",
    label: "08 / EINORDNUNG",
    description:
      "Ein beobachteter Effekt ist nur dann ein Nachweis, wenn wir ihn dem richtigen Mechanismus zuordnen.",
    notes:
      "Requests, TCP-Verbindungen und Pakete unterscheiden. Retransmits können mehrere Drops verursachen. Eine Antwort belegt bediente Kommunikation, ein Auswahlereignis allein noch keinen Erfolg. Die Browser-Simulation ist ein Erklärmodell und ersetzt keine technische Linux-Vorprobe.",
    kind: "cards",
    sourceIds: [4, 5, 6],
    items: [
      ["Beobachten", "Flow-Ereignisse und erfolgreiche Antworten vergleichen."],
      ["Verteilen", "Neue Verbindungen und Backend-Antworten auswerten."],
      ["Absichern", "Vorher, Einschränkung und Wiederherstellung testen."],
    ],
  },
  {
    title: "Drei Gedanken zum Mitnehmen.",
    short: "Fazit & Fragen",
    section: "Abschluss",
    time: "05:00",
    label: "09 / TAKEAWAYS & DISKUSSION",
    description:
      "eBPF erweitert Sichtbarkeit und Entscheidungen. Der Hook bestimmt die Möglichkeiten.",
    notes:
      "Drei Kernaussagen zusammenfassen. Anschließend Diskussionsfragen verwenden. 1: Hooks, Verifier, JIT, Maps erklären. 2: Zwei belegte Produktionseinsätze nennen. 3: Warum neue TCP-Verbindungen zum Prüfen der Lastverteilung, und wie Filterung nachweisen? Die Antworten lassen sich auf dieser Folie einzeln einblenden.",
    kind: "questions",
    sourceIds: [0, 1, 2, 3],
  },
  {
    title: "Zum Weiterdenken. Und Nachlesen.",
    short: "Quellen & Referenzen",
    section: "Abschluss",
    time: "—",
    label: "REFERENZEN",
    description:
      "Primärquellen zu Technologie, Produktionsanwendungen und dem geplanten Labor.",
    notes:
      "Referenzen sind auch im Handout enthalten. Der Stand des mitgelieferten Inhaltsplans ist der 17. Oktober 2026. Historische Unternehmensbeispiele sind als dokumentierte Einsätze zu verstehen. Handout vorab verteilen.",
    kind: "sources",
    sourceIds: sources.map((_, i) => i),
  },
];
export const questions = [
  [
    "Welche Aufgaben haben Hooks, Verifier, JIT und Maps?",
    "Hooks bestimmen Zeitpunkt und Kontext. Der Verifier prüft die Zulässigkeit. Der JIT übersetzt auf unterstützten Systemen Bytecode in Maschinencode. Maps speichern Konfiguration, Zustand und Messwerte.",
  ],
  [
    "Nenne zwei konkrete Produktionseinsätze.",
    "Meta/Katran verteilt Netzwerkverkehr mit eBPF/XDP. Netflix/Flow Exporter erfasst TCP-Flows für Netzwerkeinblicke. Weitere Beispiele: Cloudflare/L4Drop und Azure CNI powered by Cilium.",
  ],
  [
    "Warum prüfen wir neue TCP-Verbindungen?",
    "Viele HTTP-Anfragen können dieselbe Verbindung nutzen. Erst neue Verbindungen zeigen neue Backend-Auswahl. Filterung prüfen wir mit Vorher-/Nachher-Tests, passenden Drops, erlaubtem Kontrollzugriff und Wiederherstellung.",
  ],
];
