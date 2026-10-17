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
      "Wir untersuchen drei konkrete Fragen: Welcher Pod antwortet? Wann wechselt das Backend? Und warum erreicht ein Client den Dienst nicht?\n\nNach den Grundlagen führen wir echte Python-Anfragen in einem separaten Linux-Labor aus. Die Website zeigt den ausgeführten Code, die tatsächliche Ausgabe und Hubble. Auf dem zweiten Bildschirm bleiben nur die Folien sichtbar.",
  },
  {
    title: "Was ist eBPF?",
    short: "Grundprinzip",
    section: "Grundlagen",
    time: "01:30",
    kind: "definition",
    sourceIds: [0],
    bullets: [
      "Linux lädt eBPF-Bytecode und prüft ihn vor der Ausführung.",
      "Ein Hook legt fest, bei welchem Ereignis das Programm läuft.",
      "Maps speichern Regeln, Zustand und Messwerte.",
    ],
    notes:
      "eBPF stammt vom Berkeley Packet Filter ab. Heute unterstützt Linux zahlreiche Ereignisse und Programmtypen. Ein Programm wird als Bytecode geladen und vor der Ausführung geprüft.\n\nEin Hook bestimmt Ereignis und Kontext. Maps halten Regeln, Zustand oder Messwerte. In unserem Labor läuft Python im Userspace. Cilium verwaltet die BPF-Programme im Linux-Kernel der Docker-VM.",
  },
  {
    title: "Laden und Ausführen eines eBPF-Programms",
    short: "Programmablauf",
    section: "Grundlagen",
    time: "01:00",
    kind: "lifecycle",
    sourceIds: [0, 1],
    bullets: [
      "Beim Laden: Der Verifier prüft das Programm; der JIT übersetzt es, wenn unterstützt.",
      "Beim Anbinden: Der Hook bestimmt Ereignis und verfügbaren Kontext.",
      "Zur Laufzeit: Ein passendes Ereignis löst die Ausführung aus.",
    ],
    notes:
      "Beim Laden prüft der Verifier den Bytecode. Auf unterstützten Systemen übersetzt der JIT ihn in Maschinencode. Anschließend wird das Programm an einen passenden Hook gebunden.\n\nDas Paket löst die spätere Ausführung aus; es lädt das Programm nicht neu. In der Praxis übernimmt Cilium das Einrichten und Aktualisieren dieses Datenpfads.",
  },
  {
    title: "Verifier und JIT haben unterschiedliche Aufgaben",
    short: "Verifier und JIT",
    section: "Grundlagen",
    time: "01:00",
    kind: "verifier",
    sourceIds: [0, 1],
    bullets: [
      "Verifier: Sind Speicherzugriffe und Programmablauf zulässig?",
      "JIT: Bytecode in Maschinencode für die CPU übersetzen.",
      "Die fachliche Regel prüft keiner von beiden: Ein falscher Port bleibt ein falscher Port.",
    ],
    notes:
      "Die Originalgrafik aus der Cilium-Dokumentation zeigt den Übersetzungsschritt. Der Verifier prüft vorher unter anderem Speicherzugriffe und den Programmablauf. Der JIT übersetzt zulässigen Bytecode für die CPU.\n\nOb unsere Regel fachlich richtig ist, wissen beide nicht. Deshalb testen wir später gesperrten Client, erlaubte Kontrolle und Wiederherstellung getrennt.",
  },
  {
    title: "Maps: gemeinsamer Zustand im Datenpfad",
    short: "eBPF-Maps",
    section: "Grundlagen",
    time: "01:00",
    kind: "maps",
    sourceIds: [0],
    bullets: [
      "Cilium verwaltet Service- und Policy-Einträge in BPF-Maps.",
      "cilium-dbg liest die tatsächlichen Inhalte aus.",
    ],
    notes:
      "Die Originalgrafik zeigt eine Map, auf die mehrere Userspace-Prozesse und BPF-Programme zugreifen. Maps sind typisierte Datenstrukturen; nicht jeder Map-Typ erlaubt dieselben Operationen.\n\nIm Labor schreibt Cilium unter anderem Service-Zuordnungen und Policy-Einträge in Maps. Wir lesen mit cilium-dbg den tatsächlichen Inhalt aus und gleichen ihn mit Pod-Adressen und Identitäten ab.",
  },
  {
    title: "Wichtige Hooks für Netzwerkaufgaben",
    short: "Hooks im Vergleich",
    section: "Grundlagen",
    time: "01:00",
    kind: "hooks",
    sourceIds: [0, 5, 6],
    bullets: [
      "Der Hook bestimmt, welche Daten ein Programm sieht und welche Aktionen möglich sind.",
      "Cilium nutzt mehrere Hooks. Eine Cilium-Netzwerkregel ist nicht automatisch ein XDP-Filter.",
    ],
    notes:
      "Der Hook legt fest, welche Daten ein Programm sieht und welche Aktionen möglich sind. Diese Tabelle ist kein Paketablauf von oben nach unten.\n\nUnser Labor verwendet Cilium mit kube-proxy replacement. In der verschachtelten Docker-Umgebung ist Socket-LB auf den Host-Namespace begrenzt; Pod-Serviceverkehr wird im TC-Datenpfad umgesetzt. Die Netzwerkregel ist kein eigener XDP-Filter.",
  },
  {
    title: "Dokumentierte eBPF-Einsätze bei Unternehmen",
    short: "Produktionseinsätze",
    section: "Anwendungen",
    time: "02:00",
    kind: "companies",
    sourceIds: [2, 3, 8, 7],
    bullets: [
      "Die Beispiele bezeichnen konkrete Systeme und dokumentierte Einsätze.",
    ],
    notes:
      "Meta dokumentiert Katran für Netzwerk-Lastverteilung mit eBPF und XDP. Netflix beschreibt seinen Flow Exporter für TCP-Flows. Microsoft bietet Azure CNI powered by Cilium an, Cloudflare dokumentiert L4Drop.\n\nDiese Quellen belegen konkrete Systeme und Aufgaben. Sie bedeuten nicht, dass die gesamte Infrastruktur dieser Unternehmen denselben Mechanismus verwendet.",
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
      "Im Namespace ebpf-talk stehen zwei Python-Webserver hinter dem Service web auf Port 8080. Client A trägt role=trusted, Client B role=guest. Beide verwenden dieselbe Service-Adresse.\n\nHubble erzeugt die Service Map aus beobachtetem Verkehr. Die HTTP-Regeln in unserer Policy aktivieren zusätzlich L7-Sichtbarkeit über Envoy. Die Grafik auf dieser Folie ist ein originales Cilium-Asset; die nächste Hubble-Ansicht ist das laufende Labor.",
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
      "Zeige zuerst server.py: Das Backend liefert seinen Podnamen, die Request-ID und die Gegenstelle der Serververbindung. Starte dann eine Anfrage von Client A. Die Ausgabe stammt aus kubectl exec im Labor.\n\nWechsle zu Backend-Logs und suche dieselbe Request-ID. Öffne anschließend Hubble UI oder die erfassten Flowdetails. Dort ordnen wir Client, Ziel-Endpoint und Verdict zu. Zeitstempel und Identitäten helfen bei der Zuordnung; ein beliebiger älterer Flow ist kein Beleg für diese Anfrage.",
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
    time: "02:00",
    kind: "lab",
    sourceIds: [6],
    bullets: [
      "Service-IP und Backend-Adressen in der BPF-LB-Map zuordnen.",
      "Endpoint-Identitäten mit Policy-Einträgen vergleichen.",
    ],
    notes:
      "Jetzt lesen wir den realen Kernelzustand. Pods und Service liefern die IP-Adressen; endpoint list liefert die zugehörigen Sicherheitsidentitäten. bpf lb list zeigt Service-Frontend und Backends.\n\nIn den Policy-Maps suchen wir die freigegebene Identität und den Port. Vergleiche die Map vor und nach der Label-Regel. Die Ausgabe ist umfangreich; wir lesen gezielt die relevanten Einträge. Cilium verwaltet diese Maps, Python schreibt sie in diesem Labor nicht selbst.",
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
