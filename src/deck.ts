export const sources = [
  ["eBPF: Funktionsweise und Maps", "https://ebpf.io/what-is-ebpf/"],
  ["Linux: eBPF Verifier", "https://docs.kernel.org/bpf/verifier.html"],
  [
    "Meta: Katran (2018)",
    "https://engineering.fb.com/2018/05/22/open-source/open-sourcing-katran-a-scalable-network-load-balancer/",
  ],
  [
    "Netflix: Flow Exporter (2021)",
    "https://netflixtechblog.com/how-netflix-uses-ebpf-flow-logs-at-scale-for-network-insight-e3ea997dca96",
  ],
  [
    "Cilium: Hubble",
    "https://docs.cilium.io/en/stable/observability/hubble/index.html",
  ],
  [
    "Cilium: Socket Load Balancing",
    "https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/",
  ],
  ["XDP: Praktisches Tutorial", "https://github.com/xdp-project/xdp-tutorial"],
  [
    "Cloudflare: L4Drop / DDoS-Abwehr (2024)",
    "https://blog.cloudflare.com/how-cloudflare-auto-mitigated-world-record-3-8-tbps-ddos-attack/",
  ],
  [
    "Microsoft: Azure CNI mit Cilium",
    "https://learn.microsoft.com/en-us/azure/aks/network-policy-best-practices",
  ],
];
export type Slide = {
  title: string;
  short: string;
  section: string;
  time: string;
  notes: string;
  kind: string;
  sourceIds: number[];
  bullets: string[];
};
export const slides: Slide[] = [
  {
    title: "eBPF im Linux-Netzwerk",
    short: "Thema und Ablauf",
    section: "Einleitung",
    time: "01:00",
    kind: "title",
    sourceIds: [0],
    bullets: [
      "Wie führt Linux eBPF-Programme aus?",
      "Wie nutzen Unternehmen eBPF im Netzwerk?",
      "Wie lassen sich Verbindungen verteilen und Pakete filtern?",
    ],
    notes:
      "Bei einem Webdienst können drei unterschiedliche Probleme auftreten: Wir wissen nicht, wer zugreift, ein Backend bekommt zu viel Last oder unerwünschter Verkehr erreicht den Dienst.\n\nWir klären zuerst, wie eBPF im Kernel arbeitet. Danach sehen wir konkrete Einsätze bei Unternehmen. Im Praxisteil untersuchen wir Verbindungen, Lastverteilung und einen Portfilter. Die interaktive Demo dieser Website ist zunächst eine Simulation.",
  },
  {
    title: "Was ist eBPF?",
    short: "Grundprinzip",
    section: "Grundlagen",
    time: "02:00",
    kind: "definition",
    sourceIds: [0],
    bullets: [
      "Linux lädt eBPF-Bytecode und prüft ihn vor der Ausführung.",
      "Ein Hook legt fest, bei welchem Ereignis das Programm läuft.",
      "Maps speichern Regeln, Zustand und Messwerte.",
    ],
    notes:
      "eBPF stammt vom Berkeley Packet Filter ab. Ursprünglich ging es um Paketfilterung; heute werden auch andere Kernelereignisse unterstützt.\n\nEin eBPF-Programm wird als Bytecode geladen und vor der Ausführung geprüft. Es läuft an einem festgelegten Hook, etwa bei einem Netzwerkereignis. Dafür bauen wir den Kernel nicht neu. Python übernimmt in unserem Aufbau Anwendung und Steuerung; es läuft nicht als Python-Code im Kernel.",
  },
  {
    title: "Laden und Ausführen eines eBPF-Programms",
    short: "Programmablauf",
    section: "Grundlagen",
    time: "02:00",
    kind: "lifecycle",
    sourceIds: [0, 1],
    bullets: [
      "Beim Laden: Der Verifier prüft das Programm; der JIT übersetzt es, wenn unterstützt.",
      "Beim Anbinden: Der Hook bestimmt Ereignis und verfügbaren Kontext.",
      "Zur Laufzeit: Ein passendes Ereignis löst die Ausführung aus.",
    ],
    notes:
      "Wir trennen das Laden vom späteren Ausführen. Beim Laden prüft der Verifier den Bytecode. Auf unterstützten Systemen übersetzt der JIT ihn in Maschinencode. Danach wird das Programm an einen Hook gebunden.\n\nBeispiel: Ein Programm hängt am XDP-Hook eines Interfaces. Sobald dort ein Paket ankommt, bekommt es dessen Kontext und liefert eine Entscheidung. Das Programm wird nicht für jedes Paket neu geladen.",
  },
  {
    title: "Verifier und JIT haben unterschiedliche Aufgaben",
    short: "Verifier und JIT",
    section: "Grundlagen",
    time: "02:00",
    kind: "verifier",
    sourceIds: [0, 1],
    bullets: [
      "Verifier: Sind Speicherzugriffe und Programmablauf zulässig?",
      "JIT: Bytecode in Maschinencode für die CPU übersetzen.",
      "Die fachliche Regel prüft keiner von beiden: Ein falscher Port bleibt ein falscher Port.",
    ],
    notes:
      "Ein Paket kann kürzer sein als erwartet. Bevor ein Programm einen Header liest, muss es nachweisen, dass die benötigten Bytes vorhanden sind. Solche Bedingungen verfolgt der Verifier.\n\nDer JIT hat eine andere Aufgabe: Er übersetzt Bytecode in Maschinencode. Beide entscheiden nicht, ob unsere Filterregel fachlich richtig ist. Sperren wir versehentlich Port 8080 statt 9090, kann das Programm trotzdem zulässig sein.",
  },
  {
    title: "Maps: Regeln setzen und Zähler auslesen",
    short: "eBPF-Maps",
    section: "Grundlagen",
    time: "02:00",
    kind: "maps",
    sourceIds: [0],
    bullets: [
      "Userspace schreibt die Regel: TCP-Zielport 9090 sperren.",
      "Das eBPF-Programm liest die Regel und aktualisiert Aktionszähler.",
      "Userspace liest PASS und DROP aus, ohne das Programm neu zu laden.",
    ],
    notes:
      "Maps sind Datenstrukturen, auf die eBPF-Programme und Anwendungen im Userspace zugreifen können. In unserem Beispiel enthalten sie einen gesperrten Port und zwei Zähler.\n\nPython schreibt die Portregel über ein Werkzeug oder eine API. Das Kernelprogramm liest die Regel bei der Paketverarbeitung und erhöht den passenden Zähler. Python liest die Werte wieder aus. Die angezeigten Zahlen sind ein Beispiel mit fünf Paketen, keine Messung am MacBook.",
  },
  {
    title: "Wichtige Hooks für Netzwerkaufgaben",
    short: "Hooks im Vergleich",
    section: "Grundlagen",
    time: "02:00",
    kind: "hooks",
    sourceIds: [0, 5, 6],
    bullets: [
      "Der Hook bestimmt, welche Daten ein Programm sieht und welche Aktionen möglich sind.",
      "Cilium nutzt mehrere Hooks. Eine Cilium-Netzwerkregel ist nicht automatisch ein XDP-Filter.",
    ],
    notes:
      "Ein Hook ist der Einsatzpunkt eines Programms. XDP verarbeitet eingehende Pakete. Socket-Hooks können bei einem Verbindungsaufbau ein Service-Ziel auf ein Backend umsetzen. TC arbeitet an der Paketverarbeitung eines Interfaces. Tracepoints liefern Ereignisse zum Beobachten.\n\nDiese Tabelle ist kein Paketablauf von oben nach unten. Es sind unterschiedliche Einsatzpunkte. Native XDP läuft im Treiberpfad; unser geplanter separater Linux-Versuch verwendet Generic XDP.",
  },
  {
    title: "Dokumentierte eBPF-Einsätze bei Unternehmen",
    short: "Produktionseinsätze",
    section: "Anwendungen",
    time: "03:00",
    kind: "companies",
    sourceIds: [2, 3, 8, 7],
    bullets: [
      "Die Beispiele bezeichnen konkrete Systeme und dokumentierte Einsätze.",
    ],
    notes:
      "Meta hat Katran als Netzwerk-Load-Balancer mit eBPF und XDP veröffentlicht. Netflix beschreibt einen Flow Exporter, der TCP-Flows über eBPF-Tracepoints erfasst.\n\nMicrosoft bietet Azure CNI powered by Cilium für AKS an. Cloudflare dokumentiert L4Drop für die DDoS-Abwehr. Wir betrachten also Lastverteilung, Beobachtung und Zugriffskontrolle. Daraus folgt nicht, dass die gesamte Infrastruktur dieser Unternehmen denselben Mechanismus verwendet.",
  },
  {
    title: "Versuchsaufbau: ein Service, zwei Backends",
    short: "Versuchsaufbau",
    section: "Praxis",
    time: "01:00",
    kind: "topology",
    sourceIds: [4, 5],
    bullets: [
      "Client A und Client B greifen auf dieselbe Service-Adresse zu.",
      "Jedes Python-Backend antwortet mit seinem eigenen Namen.",
      "Geplant für Linux: k3d + Cilium + Hubble; XDP in einem separaten Testnetz.",
    ],
    notes:
      "Die beiden Clients sprechen dieselbe Service-Adresse an. Hinter ihr stehen zwei Python-Webserver. Die Antwort enthält den Backend-Namen, damit wir erkennen, welcher Server eine Anfrage bedient hat.\n\nIm geplanten Linux-Labor übernimmt Cilium den Datenpfad und Hubble zeigt die Flows. Die Website bildet diese Effekte bisher im Browser nach. Der eigene XDP-Portfilter gehört in ein separates Testnetz und wird nicht in den Cilium-Datenpfad eingebaut.",
  },
  {
    title: "Welche Instanz beantwortet diese Anfrage?",
    short: "A · Beobachten",
    section: "Praxis",
    time: "03:00",
    kind: "lab",
    sourceIds: [4],
    bullets: [
      "Neue Verbindung erzeugen → Client, Entscheidung und Backend zuordnen.",
      "Im Linux-Labor: Backend-Antwort und passenden Hubble-Flow vergleichen.",
    ],
    notes:
      "Zuerst fragen wir, ob die Service-Adresse das antwortende Backend verrät. Wir halten die Vorhersage fest und gehen dann Schritt für Schritt vor: Verbindungsaufbau, Backend-Zuordnung, Antwort und Auswertung.\n\nDie Antwort backend-a wird mit Quelle und Route korreliert. Anschließend verfolgen wir Client B. Die Adressen und Ereignisse sind Modelldaten. Im Linux-Labor würden wir genau diese Verbindung mit Hubble und der echten HTTP-Antwort abgleichen.",
  },
  {
    title: "Fünf HTTP-Anfragen: eine oder fünf Verbindungen?",
    short: "B · Lastverteilung",
    section: "Praxis",
    time: "04:00",
    kind: "lab",
    sourceIds: [5],
    bullets: [
      "Zehn neue Verbindungen erzeugen und die Backend-Antworten zählen.",
      "Mehrere HTTP-Anfragen auf derselben TCP-Verbindung bedeuten keine neue Backend-Auswahl.",
    ],
    notes:
      "Wir vergleichen zwei Fälle mit jeweils fünf HTTP-Anfragen. Zuerst verwenden alle dieselbe TCP-Verbindung: conn-01 bleibt Backend A zugeordnet. Danach öffnen wir für jede Anfrage eine neue Verbindung.\n\nJetzt erscheinen fünf conn-IDs und im Beispiel beide Backends. Die fest gewählte Beispielverteilung ist keine versprochene Quote. Das Lernziel ist der Unterschied zwischen HTTP-Anfrage und TCP-Verbindung. Die Wiedergabe lässt sich jederzeit pausieren oder einzeln weiterschalten.",
  },
  {
    title: "Was sieht ein blockierter Client?",
    short: "C · Netzwerkregel",
    section: "Praxis",
    time: "05:00",
    kind: "lab",
    sourceIds: [4, 5],
    bullets: [
      "Regel aktiv: Nur Client A darf den Webdienst erreichen.",
      "Client B testen → Regel entfernen → Zugriff erneut testen.",
    ],
    notes:
      "Wir führen vier Versuche aus: Client B ohne Regel, Client B mit Regel, Client A als erlaubte Kontrolle und Client B nach Rücknahme. Vor jeder Ausführung fragen wir nach der erwarteten Entscheidung.\n\nIm Inspector sehen wir Quelle und aktive Regel. Bei einem Drop endet der Pfad vor dem Dienst. Der Client erhält keinen HTTP-403-Status, weil der Webserver den Request nicht verarbeitet. Die abgeschlossenen Fälle werden unten als Vergleich festgehalten.",
  },
  {
    title: "Wo endet ein verworfenes Paket?",
    short: "D · XDP-Portfilter",
    section: "Praxis",
    time: "03:00",
    kind: "lab",
    sourceIds: [6],
    bullets: [
      "Filter aktiv: TCP/9090 → DROP; TCP/8080 → PASS.",
      "Filter deaktivieren und die Erreichbarkeit erneut prüfen.",
    ],
    notes:
      "Wir lesen zuerst den Zielport des modellierten Pakets, schlagen die Regel-Map nach und vergleichen den Wert. Erst danach erscheint PASS oder DROP. Wir vergleichen 9090 ohne Filter, 9090 gesperrt, 8080 als Kontrolle und 9090 nach Rücknahme.\n\nBei DROP endet der Pfad am XDP-Hook und der DROP-Zähler wird erhöht. PASS erlaubt nur die weitere Verarbeitung; es belegt noch keine HTTP-Antwort. Alle Schritte sind simuliert, keine Ausführung im Linux-Kernel.",
  },
  {
    title: "Welche Ergebnisse müssen wir nachweisen?",
    short: "Testmatrix und Grenzen",
    section: "Auswertung",
    time: "01:00",
    kind: "results",
    sourceIds: [4, 5, 6],
    bullets: [
      "Eine Browser-Simulation ersetzt keinen Test des Linux-Datenpfads.",
      "HTTP-Anfragen, TCP-Verbindungen und Pakete sind unterschiedliche Messgrößen.",
    ],
    notes:
      "Die Versuche brauchen jeweils einen passenden Nachweis. Für Lastverteilung vergleichen wir Antworten auf neue Verbindungen. Für Filterung brauchen wir einen vorher erfolgreichen Zugriff, einen passenden Drop und einen weiterhin erlaubten Kontrollzugriff.\n\nNach dem Entfernen der Regel prüfen wir die Wiederherstellung. Ein fehlgeschlagener Verbindungsversuch kann mehrere verworfene Pakete erzeugen, etwa durch Wiederholungen. Deshalb setzen wir Requests, Verbindungen und Paketzähler nicht gleich.",
  },
  {
    title: "Fragen zur Wiederholung",
    short: "Fragen und Diskussion",
    section: "Abschluss",
    time: "05:00",
    kind: "questions",
    sourceIds: [0, 1, 2, 3],
    bullets: [],
    notes:
      "Diese drei Fragen fassen die Lernziele zusammen. Bei der ersten geht es um die Bausteine der Technologie. Bei der zweiten müssen Unternehmen, System und Aufgabe zusammenpassen.\n\nBei der dritten ist der Unterschied zwischen einer HTTP-Anfrage und einer TCP-Verbindung entscheidend. Die Antworten lassen sich einzeln einblenden. Für die Filterung gehören Kontrollzugriff und Wiederherstellung zum Nachweis dazu.",
  },
  {
    title: "Quellen",
    short: "Quellen",
    section: "Anhang",
    time: "—",
    kind: "sources",
    sourceIds: [],
    bullets: [],
    notes:
      "Die Quellen sind direkt verlinkt und stehen zusätzlich im herunterladbaren Handout. Die Unternehmensbeispiele beziehen sich auf die genannten Veröffentlichungen beziehungsweise die verlinkte Produktdokumentation.\n\nFür den noch ausstehenden Linux-Aufbau müssen wir eine funktionierende Versionskombination und die ausgeführten Tests dokumentieren. Die interaktive Website liefert dafür bislang ein Erklärmodell, keine gemessenen Ergebnisse.",
  },
];
export const questions = [
  [
    "Welche Aufgaben haben Hook, Verifier, JIT und Maps?",
    "Hook: Ereignis und Kontext. Verifier: Zulässigkeit prüfen. JIT: in Maschinencode übersetzen. Maps: Regeln, Zustand und Messwerte speichern.",
  ],
  [
    "Nenne zwei Unternehmen, das jeweilige System und dessen Aufgabe.",
    "Meta / Katran: Netzwerk-Lastverteilung mit eBPF und XDP. Netflix / Flow Exporter: TCP-Flows für Netzwerkeinblicke erfassen.",
  ],
  [
    "Warum erzeugt der Lastverteilungstest neue TCP-Verbindungen?",
    "Mehrere HTTP-Anfragen können eine Verbindung teilen und dadurch beim selben Backend bleiben. Neue Verbindungen ermöglichen eine neue Backend-Auswahl.",
  ],
];
