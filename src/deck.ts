export const sources = [
  ["eBPF.io: What is eBPF?", "https://ebpf.io/what-is-ebpf/"],
  ["IBM Think: Was ist eBPF?", "https://www.ibm.com/de-de/think/topics/ebpf"],
  ["Linux-Kernel-Dokumentation: eBPF-Verifier", "https://docs.kernel.org/bpf/verifier.html"],
  [
    "Meta: Katran (2018)",
    "https://engineering.fb.com/2018/05/22/open-source/open-sourcing-katran-a-scalable-network-load-balancer/",
  ],
  [
    "Netflix: Flow Exporter (2021)",
    "https://netflixtechblog.com/how-netflix-uses-ebpf-flow-logs-at-scale-for-network-insight-e3ea997dca96",
  ],
  [
    "Cloudflare: L4Drop / DDoS-Abwehr (2024)",
    "https://blog.cloudflare.com/how-cloudflare-auto-mitigated-world-record-3-8-tbps-ddos-attack/",
  ],
  ["XDP-Projekt: Praktisches Tutorial", "https://github.com/xdp-project/xdp-tutorial"],
  [
    "Cilium: Hubble (im Labor als Fertigbaustein)",
    "https://docs.cilium.io/en/stable/observability/hubble/index.html",
  ],
  [
    "Cilium: Socket-Load-Balancing (im Labor als Fertigbaustein)",
    "https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/",
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
  notesId: string;
  kind: string;
  labStep?: number;
  sourceIds: number[];
  bullets: string[];
};
export const slides: Slide[] = [
  {
    title: "eBPF: Netzwerk in modernen Linux Applikationen",
    short: "Thema und Ablauf",
    section: "Einleitung",
    time: "00:45",
    kind: "title",
    sourceIds: [0, 1],
    bullets: [
      "Was eBPF ist, ohne Kenntnisse im Kernel-Bau.",
      "Wo Programme andocken und was sie dort dürfen.",
      "Drei Experimente: Paketfilter, Lastverteilung, Zugriffsregel.",
    ],
    notesId: "01-titel",
  },
  {
    title: "Was ist eBPF?",
    short: "Was ist eBPF?",
    section: "Grundlagen",
    time: "01:30",
    kind: "definition",
    sourceIds: [0, 1],
    bullets: [
      "Kleine Programme im Linux-Kernel ausführen, ohne ihn für jede Aufgabe umzubauen.",
      "Auf Ereignisse reagieren: beobachten, filtern oder weiterleiten.",
    ],
    notesId: "02-was-ist-ebpf",
  },
  {
    title: "Warum eBPF?",
    short: "Nutzen und Einsatz",
    section: "Grundlagen",
    time: "01:15",
    kind: "benefits",
    sourceIds: [0, 1],
    bullets: ["Performance: Pakete direkt im Kernel verarbeiten.", "Security: begrenzte Ausführung und geprüfter Code.", "Flexibilität: Verhalten zur Laufzeit ergänzen."],
    notesId: "03-warum-ebpf",
  },
  {
    title: "Was sind Hooks?",
    short: "Hooks",
    section: "Grundlagen",
    time: "01:45",
    kind: "hooks",
    sourceIds: [0, 8, 6],
    bullets: [
      "Ein Hook bestimmt Ereignis, Kontext und erlaubte Aktionen.",
      "XDP: früher Paketempfang. TC: Pakete am Interface. Socket-Hooks: Verbindungsoperationen. Tracepoints: Ereignisse beobachten.",
    ],
    notesId: "04-hooks",
  },
  {
    title: "Welche Rolle spielt der Verifier?",
    short: "Verifier",
    section: "Grundlagen",
    time: "01:00",
    kind: "verifier",
    sourceIds: [0, 2],
    bullets: [
      "Prüft den Bytecode beim Laden und lehnt unzulässige Programme ab.",
      "Speicherzugriffe und Paketgrenzen müssen nachweisbar zulässig sein.",
      "Die fachliche Richtigkeit einer Filterregel bleibt eine Testaufgabe.",
    ],
    notesId: "05-verifier",
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
    notesId: "06-jit",
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
    notesId: "07-maps",
  },
  {
    title: "eBPF im produktiven Einsatz",
    short: "Produktionseinsätze",
    section: "Anwendungen",
    time: "02:00",
    kind: "companies",
    sourceIds: [10],
    bullets: [
      "Google, Netflix, Android, S&P Global, Meta und Cloudflare: Beispiele aus der Produktionsübersicht auf ebpf.io.",
    ],
    notesId: "08-produktiver-einsatz",
  },
  {
    title: "Unser Experiment: ein Dienst, zwei Backends",
    short: "Versuchsaufbau",
    section: "Praxis",
    time: "01:00",
    kind: "topology",
    sourceIds: [7, 8],
    bullets: [
      "Ein Dienst, zwei antwortende Prozesse: Wer bekommt die Verbindung?",
      "Zwei Clients mit unterschiedlichen Labels: Wer darf überhaupt?",
      "Ein eigenes XDP-Programm: Welches Paket wird verworfen?",
    ],
    notesId: "09-versuchsaufbau",
  },
  {
    title: "Zwei Eingänge: 8080 und 9090",
    short: "A · XDP beobachten",
    section: "Praxis",
    time: "02:30",
    kind: "lab",
    labStep: 9,
    sourceIds: [6],
    bullets: [
      "Zwei Ports sind erreichbar: 8080 und 9090.",
      "Das XDP-Programm zählt PASS und DROP in Maps.",
      "Noch ist keine Regel aktiv. Wir messen zuerst den Normalzustand.",
    ],
    notesId: "10-xdp-beobachten",
  },
  {
    title: "Die Regel ändern, das Programm behalten",
    short: "B · XDP mit Map",
    section: "Praxis",
    time: "02:30",
    kind: "lab",
    labStep: 10,
    sourceIds: [0, 6],
    bullets: [
      "Python schreibt 9090 in die Map. Das XDP-Programm bleibt geladen.",
      "9090 läuft in einen Timeout, DROP steigt. 8080 antwortet weiter, PASS steigt.",
      "Regel auf 0 setzen: 9090 antwortet wieder. Die Programm-ID bleibt gleich.",
    ],
    notesId: "11-xdp-regel",
  },
  {
    title: "Wer bekommt die Verbindung?",
    short: "C · Lastverteilung",
    section: "Praxis",
    time: "02:30",
    kind: "lab",
    labStep: 11,
    sourceIds: [8],
    bullets: [
      "Fünf HTTP-Anfragen auf einer Verbindung bleiben beim selben Backend.",
      "Zehn neue Verbindungen können andere Backends erreichen.",
      "Die Entscheidung fällt pro Verbindung, nicht pro Paket.",
    ],
    notesId: "12-lastverteilung",
  },
  {
    title: "Darf diese Verbindung überhaupt?",
    short: "D · Netzwerkregel",
    section: "Praxis",
    time: "03:00",
    kind: "lab",
    labStep: 12,
    sourceIds: [7, 8],
    bullets: [
      "Erst beide Clients erlauben, dann nur noch Client A.",
      "Client B bekommt einen Timeout, keinen HTTP-403: Die Verbindung entsteht gar nicht.",
      "Regel zurücknehmen und die Wiederherstellung zeigen.",
    ],
    notesId: "13-netzwerkregel",
  },
  {
    title: "Was wir gesehen haben",
    short: "Ergebnisse und Grenzen",
    section: "Auswertung",
    time: "01:00",
    kind: "results",
    sourceIds: [6, 7, 8],
    bullets: [
      "Kontrollanfragen helfen, die Ursache einzugrenzen.",
      "Der Hook bestimmt die Sicht: XDP sieht Pakete, der Socket-Hook sieht Verbindungen.",
      "Die Prüfung durch den Verifier ersetzt keinen Funktionstest.",
    ],
    notesId: "14-ergebnisse",
  },
  {
    title: "Fragen zur Wiederholung",
    short: "Fragen und Diskussion",
    section: "Abschluss",
    time: "02:00",
    kind: "questions",
    sourceIds: [0, 2, 6],
    bullets: [],
    notesId: "15-fragen",
  },
  {
    title: "Quellen",
    short: "Quellen",
    section: "Anhang",
    time: "—",
    kind: "sources",
    sourceIds: [],
    bullets: [],
    notesId: "16-quellen",
  },
];
export const questions = [
  [
    "Warum braucht es eBPF, wenn man den Kernel doch ändern könnte?",
    "Eine eigene Kernel-Änderung erfordert Bau und Verteilung; eine Aufnahme in Linux zusätzlich Abstimmung. Ein Kernel-Modul läuft mit vollen Rechten und kann das System gefährden. eBPF erweitert den Kernel zur Laufzeit, ohne Quellcodeänderung und ohne Modul.",
  ],
  [
    "Was prüft der Verifier?",
    "Er prüft die Sicherheit des Programms: keine unzulässigen Speicherzugriffe, keine endlosen Schleifen, jeder Pfad endet. Er prüft nicht, ob die Regel fachlich richtig ist. Ein falscher Port bleibt ein Fehler, auch wenn das Programm geladen wird.",
  ],
  [
    "Warum entscheidet die Lastverteilung pro Verbindung?",
    "Das Backend hält den Zustand der TCP-Verbindung. Deshalb müssen deren Pakete weiter dort ankommen. Keep-alive verwendet diese Verbindung für mehrere HTTP-Anfragen. Erst eine neue Verbindung erlaubt eine neue Backend-Auswahl.",
  ],
];
