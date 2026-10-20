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
  ["eBPF.io: Organisationen im produktiven Einsatz", "https://ebpf.io/"],
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
    time: "00:30",
    kind: "title",
    sourceIds: [0],
    bullets: [
      "Wie führt Linux eBPF-Programme aus?",
      "Wie nutzen Unternehmen eBPF im Netzwerk?",
      "Wie lassen sich Verbindungen verteilen und Pakete filtern?",
    ],
    notes:
      "Wir untersuchen drei konkrete Fragen: Welcher Pod antwortet? Wann wechselt das Backend? Und warum erreicht ein Client den Dienst nicht?\n\nNach den Grundlagen führen wir echte Python-Anfragen in einem separaten Linux-Labor aus. Die Website zeigt den ausgeführten Code, die tatsächliche Ausgabe und Hubble. Auf dem zweiten Bildschirm bleiben nur die Folien sichtbar.",
  },
  {
    title: "Was ist eBPF?",
    short: "Was ist eBPF?",
    section: "Grundlagen",
    time: "01:30",
    kind: "definition",
    sourceIds: [0],
    bullets: [
      "Kleine Programme im Linux-Kernel ausführen, ohne ihn für jede Aufgabe umzubauen.",
      "Auf Ereignisse reagieren: beobachten, filtern oder weiterleiten.",
    ],
    notes:
      "eBPF steht für extended Berkeley Packet Filter. Die Technik ermöglicht kleine Programme an definierten Einsatzpunkten im Linux-Kernel. Anwendungen sind Netzwerkverarbeitung, Beobachtbarkeit und Sicherheitskontrollen. Man muss dafür nicht bei jeder neuen Aufgabe den Kernel-Quellcode ändern und einen eigenen Kernel ausliefern.\n\nEin eBPF-Programm wird nicht einfach als normale Anwendung gestartet. Ein Ereignis löst seine Ausführung aus, zum Beispiel ein eintreffendes Paket. Welcher Kontext zur Verfügung steht, hängt vom Programmtyp und Hook ab. Die nächsten vier Folien erklären diese Bausteine einzeln.",
  },
  {
    title: "Was sind Hooks?",
    short: "Hooks",
    section: "Grundlagen",
    time: "01:00",
    kind: "hooks",
    sourceIds: [0, 5, 6],
    bullets: [
      "Ein Hook bestimmt Ereignis, Kontext und erlaubte Aktionen.",
      "XDP: früher Paketempfang. TC: Pakete am Interface. Socket-Hooks: Verbindungsoperationen. Tracepoints: Ereignisse beobachten.",
    ],
    notes:
      "Ein Hook ist die Stelle, an der der Kernel unser Programm aufruft. Ich wähle ihn nach der Aufgabe: Muss ich ein Paket möglichst früh verwerfen, dessen Inhalt verändern oder nur einen Vorgang beobachten?\n\nXDP arbeitet im Empfangspfad eines Interfaces. Im nativen Modus läuft es im Treiber, bevor der übliche Netzwerk-Stack das Paket verarbeitet. Das passt etwa zur frühen DDoS-Abwehr. Generic XDP ist ein späterer, treiberunabhängiger Modus. XDP ist kein allgemeiner Hook für ausgehenden Verkehr.\n\nTC bietet Hooks am Ein- und Ausgang eines Interfaces. Dort stehen Paketdaten und der skb-Kontext bereit. Das eignet sich für Netzwerkregeln, Umleitungen und Änderungen an Paketen, auch beim Senden.\n\nSocket-Hooks greifen näher an der Anwendung ein. Ein cgroup-connect-Hook kann beispielsweise eine Zieladresse beim Verbindungsaufbau prüfen oder umschreiben. Dafür muss ich nicht jedes Paket einer Verbindung separat behandeln.\n\nTracepoints melden definierte Kernelereignisse, zum Beispiel einen TCP-Zustandswechsel oder Prozessstart. Ich verwende sie, wenn ich Abläufe und Laufzeiten beobachten möchte. Ein gewöhnlicher Tracepoint ist kein Paketfilter: Er entscheidet nicht über PASS oder DROP. Diese Hooks sind unterschiedliche Einsatzpunkte, keine Reihenfolge, die jedes Paket vollständig durchlaufen muss.",
  },
  {
    title: "Welche Rolle spielt der Verifier?",
    short: "Verifier",
    section: "Grundlagen",
    time: "01:00",
    kind: "verifier",
    sourceIds: [0, 1],
    bullets: [
      "Prüft den Bytecode beim Laden und lehnt unzulässige Programme ab.",
      "Speicherzugriffe und Paketgrenzen müssen nachweisbar zulässig sein.",
      "Die fachliche Richtigkeit einer Filterregel bleibt eine Testaufgabe.",
    ],
    notes:
      "eBPF-Code läuft in einem empfindlichen Bereich: dem Kernel. Deshalb untersucht der Verifier den Bytecode, bevor das Programm ausgeführt werden darf. Er verfolgt unter anderem mögliche Werte, Zeiger und die verschiedenen Ausführungspfade.\n\nEin konkretes Beispiel: Bevor ein Programm den TCP-Zielport liest, muss es zeigen, dass die dafür benötigten Bytes innerhalb des Pakets liegen. Fehlt dieser Nachweis, kann der Verifier das Programm beim Laden ablehnen.\n\nDie Prüfung beweist nicht, dass die fachliche Absicht stimmt. Wenn ich versehentlich Port 8080 statt 9090 sperre, kann das technisch zulässig und trotzdem falsch sein. Deshalb gehören Kontrollversuche zu einer funktionierenden Regel.",
  },
  {
    title: "Was ist JIT?",
    short: "JIT",
    section: "Grundlagen",
    time: "01:00",
    kind: "jit",
    sourceIds: [0],
    bullets: [
      "Just-in-Time-Kompilierung übersetzt geprüften Bytecode in CPU-Maschinencode.",
      "Die Übersetzung erfolgt beim Laden, nicht für jedes Paket erneut.",
      "Der JIT übersetzt; der Verifier prüft zuvor die Zulässigkeit.",
    ],
    notes:
      "JIT bedeutet Just in Time. Der Compiler des Kernels übersetzt den zugelassenen eBPF-Bytecode in Anweisungen für die jeweilige CPU, zum Beispiel ARM64 oder x86-64. Der JIT ist damit ein Übersetzer; er ersetzt den Verifier nicht.\n\nDieser Schritt passiert beim Laden auf einem System mit aktiviertem und unterstütztem JIT. Bei einem späteren Ereignis läuft der erzeugte Code. Das Paket wird also nicht jedes Mal neu kompiliert.\n\nDie Ausführung kann dadurch effizienter sein als eine Interpretation einzelner Bytecode-Anweisungen. Daraus folgt jedoch kein pauschaler Performance-Gewinn für jede Anwendung: Auch der Inhalt des Programms und der gewählte Hook verursachen Aufwand.",
  },
  {
    title: "Wofür benötigt man Maps?",
    short: "Maps",
    section: "Grundlagen",
    time: "01:00",
    kind: "maps",
    sourceIds: [0],
    bullets: [
      "Maps halten Regeln, Zustand und Messwerte über einzelne Aufrufe hinaus.",
      "Userspace und eBPF-Programme tauschen darüber Daten aus.",
      "Daten lassen sich ändern, ohne das eBPF-Programm neu zu laden.",
    ],
    notes:
      "Ein eBPF-Programm wird für einzelne Ereignisse aufgerufen. Seine lokalen Variablen sind kein gemeinsamer Langzeitspeicher. Für fortlaufende Zähler, Regeln oder Zuordnungen verwendet man Maps. Diese Datenstrukturen werden vom Kernel verwaltet. Es gibt unterschiedliche Typen, zum Beispiel Arrays und Hash-Tabellen.\n\nDas einfache Beispiel auf der Folie: Python trägt den Port 9090 in eine Map ein. Das eBPF-Programm liest diesen Wert beim Paketempfang und kann einen Zähler aktualisieren. Python liest anschließend den Zähler zur Auswertung aus. Die genauen Lese- und Schreibmöglichkeiten hängen vom Map-Typ und den Berechtigungen ab.\n\nDer wesentliche Vorteil ist die Trennung von Programm und Daten. Eine neue Portregel kann als Map-Wert geändert werden; der Programmcode muss dafür nicht neu geladen werden. Dasselbe Prinzip erlaubt auch komplexere Zustände, etwa Zuordnungen von Service-Adressen zu Backends.",
  },
  {
    title: "eBPF im produktiven Einsatz",
    short: "Produktionseinsätze",
    section: "Anwendungen",
    time: "02:00",
    kind: "companies",
    sourceIds: [9],
    bullets: [
      "Google, Netflix, Android, S&P Global, Meta und Cloudflare: Beispiele aus der Produktionsübersicht auf ebpf.io.",
    ],
    notes:
      "Diese sechs Beispiele stammen aus dem Abschnitt „Organizations in every industry use eBPF in production“ auf ebpf.io. Die Folie übernimmt dessen Kartenraster und Original-Logos.\n\nGoogle: Sicherheitsprüfung, Paketverarbeitung und Performance. Netflix: Netzwerkeinblicke in großem Maßstab. Android: Netzwerknutzung sowie Energie- und Speicher-Profiling – eBPF ist also nicht auf Rechenzentren beschränkt.\n\nS&P Global: Cilium verbindet Cloud- und lokale Umgebungen. Meta: Paketverarbeitung und Lastverteilung, unter anderem mit Katran. Cloudflare: Netzwerksicherheit, Performance und Beobachtbarkeit.\n\nDer gemeinsame Punkt ist die Verarbeitung von Ereignissen direkt im Kernel. Die konkreten Hooks und Werkzeuge unterscheiden sich je nach Aufgabe. Die Links in den Karten führen zu den auf ebpf.io genannten Belegen; die Logos bedeuten nicht, dass alle dieselbe Architektur einsetzen.",
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
      "Linux-Labor: k3d + Cilium + Hubble mit echten Python-Backends.",
    ],
    notes:
      "Im Namespace ebpf-talk stehen zwei Python-Webserver hinter dem Service web auf Port 8080. Client A trägt role=trusted, Client B role=guest. Beide verwenden dieselbe Service-Adresse.\n\nHubble erzeugt die Service Map aus beobachtetem Verkehr. Die HTTP-Regeln in unserer Policy aktivieren zusätzlich L7-Sichtbarkeit über Envoy. Die Grafik auf dieser Folie ist ein originales Cilium-Asset; die Flowdetails zeigen Messwerte aus dem laufenden Labor.",
  },
  {
    title: "Welche Instanz beantwortet diese Anfrage?",
    short: "A · Beobachten",
    section: "Praxis",
    time: "02:00",
    kind: "lab",
    sourceIds: [4],
    bullets: [
      "Neue Verbindung erzeugen → Client, Entscheidung und Backend zuordnen.",
      "Im Linux-Labor: Backend-Antwort und passenden Hubble-Flow vergleichen.",
    ],
    notes:
      "Zeige zuerst server.py: Das Backend liefert seinen Podnamen, die Request-ID und die Gegenstelle der Serververbindung. Starte dann eine Anfrage von Client A. Die Ausgabe stammt aus kubectl exec im Labor.\n\nWechsle zu Backend-Logs und suche dieselbe Request-ID. Öffne anschließend die erfassten Flowdetails. Dort ordnen wir Client, Ziel-Endpoint und Verdict zu. Zeitstempel und Identitäten helfen bei der Zuordnung; ein beliebiger älterer Flow ist kein Beleg für diese Anfrage.",
  },
  {
    title: "Keep-alive und neue TCP-Verbindungen",
    short: "B · Lastverteilung",
    section: "Praxis",
    time: "02:00",
    kind: "lab",
    sourceIds: [5],
    bullets: [
      "Zehn neue Verbindungen erzeugen und die Backend-Antworten zählen.",
      "Mehrere HTTP-Anfragen auf derselben TCP-Verbindung bedeuten keine neue Backend-Auswahl.",
    ],
    notes:
      "Zeige in client.py die Erzeugung von HTTPConnection und das Schließen im Modus new. Führe zuerst fünf Keep-alive-Anfragen aus, danach zehn neue Verbindungen. Vergleiche die tatsächlichen Backend-Namen.\n\nEine neue Verbindung ermöglicht eine neue Backend-Auswahl, garantiert aber keine andere Auswahl und keine 50:50-Verteilung. Wegen des aktiven L7-Proxys ist die serverseitige Gegenstelle kein direkter Beleg für die ursprüngliche Client-Verbindung. Dafür betrachten wir Clientcode und Hubble-Flows gemeinsam.",
  },
  {
    title: "Was sieht ein blockierter Client?",
    short: "C · Netzwerkregel",
    section: "Praxis",
    time: "04:00",
    kind: "lab",
    sourceIds: [4, 5],
    bullets: [
      "Regel aktiv: Nur Client A darf den Webdienst erreichen.",
      "Client B testen → Regel entfernen → Zugriff erneut testen.",
    ],
    notes:
      "Die offene Policy erlaubt beide Clients und erzeugt HTTP-Sichtbarkeit. Teste Client B als Ausgangspunkt. Zeige dann policy-trusted.yaml: Die zusätzliche Bedingung role=trusted schließt B aus.\n\nWende diese Policy an und teste B erneut. Vergleiche den Timeout mit einem aktuellen Hubble-Ereignis DROPPED / POLICY_DENIED. Prüfe Client A als erlaubte Kontrolle. Setze die offene Policy zurück und teste B nochmals. Erst diese Kombination zeigt Ursache, Kontrollfall und Wiederherstellung.",
  },
  {
    title: "Was steht tatsächlich in den BPF-Maps?",
    short: "D · Kernelzustand",
    section: "Praxis",
    time: "01:00",
    kind: "lab",
    sourceIds: [0, 5],
    bullets: [
      "Service-IP und Backend-Adressen in der BPF-LB-Map zuordnen.",
      "Endpoint-Identitäten mit Policy-Einträgen vergleichen.",
    ],
    notes:
      "Jetzt lesen wir den realen Kernelzustand. Pods und Service liefern die IP-Adressen; endpoint list liefert die zugehörigen Sicherheitsidentitäten. bpf lb list zeigt Service-Frontend und Backends.\n\nIn den Policy-Maps suchen wir die freigegebene Identität und den Port. Vergleiche die Map vor und nach der Label-Regel. Die Ausgabe ist umfangreich; wir lesen gezielt die relevanten Einträge. Cilium verwaltet diese Maps. Im nächsten, separaten XDP-Versuch schreibt Python selbst in eine eigene Regel-Map.",
  },
  {
    title: "XDP: eine Portregel ändern, Pakete zählen",
    short: "E · Eigener XDP-Filter",
    section: "Praxis",
    time: "03:00",
    kind: "lab",
    sourceIds: [0, 6],
    bullets: [
      "Python schreibt Port 9090 in die Regel-Map; das XDP-Programm bleibt geladen.",
      "9090 testen, 8080 als Kontrolle prüfen, Regel aufheben und 9090 erneut testen.",
    ],
    notes:
      "Dieser Versuch läuft in einem separaten veth-Testnetz. Auf talk-server/eth0 ist unser eigener Filter im Generic/SKB-Modus angebunden. Er ist unabhängig von Cilium und meldet keine Hubble-Flows. Der C-Quelltext wird vorab kompiliert; im Vortrag zeigen wir Python.\n\nZuerst beide Ports erfolgreich testen. In control.py schreibt block den Wert 9090 in blocked_port[0]. Das Programm wird dabei nicht neu geladen. Jetzt 9090 testen: Der TCP-Aufbau läuft in einen Timeout, während DROP steigt. 8080 muss weiterhin HTTP 200 liefern und PASS erhöhen.\n\nclear setzt den Map-Wert auf 0. 9090 muss wieder antworten. Vergleiche die Programm-ID vor und nach der Änderung. Die Zähler erfassen geprüfte IPv4-TCP-Pakete am Server-Eingang, keine HTTP-Anfragen. SYN-Wiederholungen können mehrere Drops pro Test erzeugen. Generic XDP ist hier ein Funktionsnachweis, kein Performance-Benchmark.",
  },
  {
    title: "Welche Ergebnisse müssen wir nachweisen?",
    short: "Testmatrix und Grenzen",
    section: "Auswertung",
    time: "01:00",
    kind: "results",
    sourceIds: [4, 5, 6],
    bullets: [
      "Jeder Laborbefehl liefert echte Ausgaben und erfasste Hubble-Ereignisse.",
      "HTTP-Anfragen, TCP-Verbindungen und Pakete sind unterschiedliche Messgrößen.",
    ],
    notes:
      "Für jede Aussage brauchen wir den passenden Nachweis. Eine Antwort belegt den verarbeitenden Backend-Pod. Ein Timeout allein beweist noch keine Policy-Sperre: Dafür benötigen wir den passenden Drop sowie den weiterhin erfolgreichen Kontrollzugriff.\n\nNach der Rücknahme muss Client B wieder antworten. HTTP-Anfragen, TCP-Verbindungen und einzelne Pakete dürfen dabei nicht gleichgesetzt werden.",
  },
  {
    title: "Fragen zur Wiederholung",
    short: "Fragen und Diskussion",
    section: "Abschluss",
    time: "03:00",
    kind: "questions",
    sourceIds: [0, 1, 2, 3],
    bullets: [],
    notes:
      "Diese drei Fragen fassen die Lernziele zusammen. Bei der ersten geht es um die Bausteine von eBPF. Bei der zweiten müssen Unternehmen, System und Aufgabe zusammenpassen.\n\nBei der dritten ist der Unterschied zwischen einer HTTP-Anfrage und einer TCP-Verbindung entscheidend. Die Antworten lassen sich einzeln einblenden. Danach bleibt Zeit für Fragen zum beobachteten Labor.",
  },
  {
    title: "Quellen",
    short: "Quellen",
    section: "Anhang",
    time: "\u2014",
    kind: "sources",
    sourceIds: [],
    bullets: [],
    notes:
      "Alle fachlichen Quellen sind direkt verlinkt und stehen im Handout. Die verwendeten Originalgrafiken, ihre Herkunft und Lizenzhinweise sind in ATTRIBUTION.md dokumentiert.\n\nDer ausführbare Laboraufbau und die Python- und YAML-Dateien liegen im Repository. Lokal erfasste Messprotokolle bleiben unter lab/evidence; sie enthalten Zeitstempel, Befehle, Ausgaben und die originalen Hubble-Flows.",
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
