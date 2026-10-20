# Inhaltsplan: eBPF im Linux-Netzwerk

> **Hinweis (Oktober 2026):** Dieses Dokument beschreibt die frühere, Cilium-zentrierte Planung und bleibt als Projektunterlage erhalten. Maßgeblich für die aktuelle Fassung sind `src/deck.ts` und `README.md`: Der Praxisteil beginnt mit dem eigenen XDP-Programm, danach folgen Lastverteilung und Netzwerkregel. Cilium und Hubble sind Werkzeuge, nicht das Thema.

**Arbeitstitel:** „eBPF: Netzwerkverkehr beobachten, verteilen und absichern“

**Leitfrage:** Wie kann Linux Programme direkt an Kernelereignissen ausführen – und weshalb nutzen große Unternehmen das für Netzwerkbetrieb, Performance und Sicherheit?

**Roter Faden:** Erst die Technologie verstehen, dann echte Unternehmenseinsätze kennenlernen und schließlich drei ihrer Aufgaben an einem kleinen Webdienst nachvollziehen. Cilium/Hubble sind Werkzeuge für die praktische Demonstration. Ein ergänzender XDP-Versuch macht die frühe Paketverarbeitung direkt sichtbar.

## 1. Rahmen und Gewichtung

**Arbeitsfassung nach dem aktuellen Feedback:** etwa **36 Minuten**, davon 15 Minuten Theorie und Einordnung, 16 Minuten Praxis, zwei Minuten Abschluss und drei Minuten Fragen. Der Vortrag soll verständlich bleiben; die Dauer ist flexibel.

Die ursprünglichen [Referatsvorgaben](RULES.md) nennen 25 Minuten und eine Bewertungsgewichtung von 40 % Theorie und 60 % Praxis. Die erweiterte Zeitplanung folgt dem aktuellen Feedback. Die Bewertungsgewichtung wird nicht als starres Minutenverhältnis interpretiert: Vorbereitung, Labor, Features und belastbare Tests liefern den praktischen Anteil.

**Abzugeben:** Folien, Praxisdateien, ein vorab bereitgestelltes Handout und drei Fragen mit Antworten.

**Vorausgesetztes Wissen:** IP-Adresse, TCP/Port und eine grobe Vorstellung von Client und Server. Kernelprogrammierung und Kubernetes-Kenntnisse werden nicht vorausgesetzt.

**Lernziele:**

1. Funktionsweise und Grenzen von eBPF anhand von Hooks, Verifier, JIT und Maps erklären.
2. Konkrete Produktionsanwendungen bei großen Unternehmen benennen und ihren Nutzen verstehen.
3. Observability, Load Balancing und Netzwerksicherheit als unterschiedliche Einsatzgebiete derselben Technologie einordnen.
4. XDP von anderen Hooks unterscheiden und Testergebnisse den richtigen Mechanismen zuordnen.

## 2. Ablauf und Folienplanung

| Zeit | Folie / Abschnitt | Inhalt und Vermittlung |
| --- | --- | --- |
| 00:00–01:00 | 1. Einstieg | Ein Dienst wird langsam oder ist nicht erreichbar: Wer verbindet sich wohin, wo landet die Verbindung und wer blockiert sie? |
| 01:00–03:00 | 2. Was ist eBPF? | Userspace/Kernel unterscheiden; Ursprung in BPF kurz nennen. Grundidee: eingeschränkte Programme erweitern Verhalten und Sichtbarkeit an definierten Kernelereignissen. |
| 03:00–05:00 | 3. Ereignisse und Lebenszyklus | Programm vorbereiten → Bytecode laden → prüfen/gegebenenfalls JIT-kompilieren → an Hook anbinden → bei Ereignissen ausführen. Ausführung an einem Paket oder Verbindungsaufbau erklären. |
| 05:00–07:00 | 4. Verifier, JIT und Grenzen | Zulässige Speicherzugriffe, kontrollierter Programmablauf, nativer Maschinencode. Der Verifier ersetzt keine fachlich korrekten Regeln; Overhead und Kernelabhängigkeiten bleiben relevant. |
| 07:00–09:00 | 5. Maps und Userspace | Gemeinsamer Zugriff auf Konfiguration und Messwerte: Backend-Tabelle, erlaubte Quellen und Aktionszähler. Python-Anwendung und eBPF-Programm im Schema getrennt zeigen. |
| 09:00–11:00 | 6. Wo eBPF arbeitet | Tracepoints für Beobachtung, Socket-Hooks für Verbindungsentscheidungen, TC für Paketverarbeitung und XDP für frühe Entscheidungen am Empfang einordnen. PASS/DROP anhand von Pseudocode erklären. |
| 11:00–14:00 | 7. eBPF bei großen Unternehmen | Eine eigene Folie mit vier Unternehmen, jeweils konkreter Anwendung, betrieblichem Zweck und Primärquelle. Keine reine Logosammlung. |
| 14:00–15:00 | 8. Unser Labor | Ein Webdienst mit zwei Python-Backends und zwei Clients. Cilium/Hubble als vorhandene Werkzeuge benennen; k3d stellt den vorbereiteten Versuchsaufbau bereit. |
| 15:00–18:00 | Praxis A: Beobachten | Python-Client erzeugt Verkehr. Hubble-Service-Map und Flowdetails zeigen Kommunikationspartner und erlaubte Verbindungen. |
| 18:00–22:00 | Praxis B: Verteilen | Neue Verbindungen zur gleichen Service-Adresse erzeugen. Backend-Namen in den Antworten sowie Flowdetails vergleichen; einfache Häufigkeitsauswertung in Python. |
| 22:00–27:00 | Praxis C: Absichern | Eine kurze Netzwerkregel erlaubt nur dem vorgesehenen Client den Zugriff. Beide Clients erneut testen, Drop-Ereignis mit Policy-Grund zeigen und Regel anschließend zurücknehmen. |
| 27:00–30:00 | Praxis D: XDP direkt sehen | Im separaten vorbereiteten VM-Testnetz eine XDP-Portregel aktivieren. TCP/9090 wird verworfen, TCP/8080 bleibt erreichbar; Zähler in Python auslesen und Regel zurücknehmen. |
| 30:00–31:00 | Gemeinsame Auswertung | Testergebnisse den Hooks zuordnen: Verbindung auswählen, Zugriff kontrollieren und Beobachtungen ausgeben. |
| 31:00–33:00 | 9. Grenzen und Kernaussagen | Was der Versuch belegt, was Produktion zusätzlich braucht und welche drei Aussagen hängen bleiben sollen. |
| 33:00–36:00 | Fragen und Diskussion | Verständnisfragen aufnehmen. |

Es entstehen etwa neun bis zwölf Folien: Die praktische Demonstration erfolgt überwiegend live. Die Zeitblöcke A–D benötigen keine jeweils eigene Theorieeinleitung. Bei Bedarf können Laborbild und Testmatrix als zusätzliche Orientierungsfolien eingeblendet werden.

## 3. Theorie: Inhalt und verständliche Vermittlung

### Grundidee, Lebenszyklus und Sicherheit

eBPF ermöglicht eingeschränkte Programme an definierten Hooks im Linux-Kernel. Verifier und JIT werden mit unterschiedlichen Aufgaben erklärt: Zulässigkeit prüfen und Bytecode auf unterstützten Systemen in Maschinencode übersetzen. Maps halten Zustand und erlauben den Austausch mit dem Userspace. [1, 2]

Für den Verifier genügt ein Beispiel ohne Pointerarithmetik: „Bevor ein Programm einen Paketheader liest, muss es nachweisen, dass diese Daten im Paket vorhanden sind.“ Ein falscher Port in einer grundsätzlich zulässigen Filterregel bleibt trotzdem ein fachlicher Fehler.

Der Vortrag verspricht weder vollständige Fehlerfreiheit noch kostenlosen Betrieb. Aufwand entsteht durch die ausgeführten Programme, die Häufigkeit der Ereignisse und die Menge der ausgegebenen Daten. Berechtigungen, unterstützte Kernelmerkmale und die Wahl des Hooks beeinflussen den Einsatz.

### Die Begriffe zueinander einordnen

| Begriff | Bedeutung |
| --- | --- |
| **eBPF** | Zugrunde liegende Technologie zur ereignisgesteuerten Ausführung eingeschränkter Programme. |
| **Hook** | Legt fest, wann ein Programm läuft und welchen Kontext es erhält. |
| **XDP** | Ein Hook für eingehende Netzwerkpakete. Native XDP arbeitet im Treiberpfad; Generic XDP später auf Socket Buffers. |
| **Observability** | Aufgabe: Verhalten anhand von Ereignissen, Messwerten und Beziehungen verständlich machen. |
| **Load Balancing / Sicherheit** | Aufgaben: Verbindungen verteilen beziehungsweise Zugriffe kontrollieren. |
| **Cilium / Hubble** | Eingesetzte Software, die mehrere eBPF-Mechanismen nutzt und deren Ergebnisse zugänglich macht. |

Cilium ist nicht gleichbedeutend mit XDP. Es nutzt mehrere Hooks; Socket Load Balancing und optionale XDP-Beschleunigung betreffen unterschiedliche Verkehrswege. [7]

### Warum Python beziehungsweise TypeScript?

**Python wird als gemeinsame Sprache der sichtbaren Praxis gewählt:** kleine HTTP-Anwendung, Request-Generator, Auswertung und Steuerung des XDP-Versuchs. So lernen die Zuhörenden keine zusätzliche Sprache für die Demo. TypeScript wäre eine gleichwertige Alternative für Anwendung und Client, bringt hier aber keinen zusätzlichen Erklärgewinn.

Die Grenze wird ausdrücklich gezeigt:

```text
Python: Anwendung, Tests, Konfiguration, Auswertung
                         |
                  Werkzeuge / APIs
                         |
Kernel: eBPF-Bytecode an Socket-, TC-, XDP- oder Tracing-Hooks
```

Gewöhnliches Python oder TypeScript läuft dabei nicht im Linux-Kernel. Die Cilium-eBPF-Programme beziehungsweise ein vorbereitetes eBPF-Objekt liefern den Kernelanteil. Auch Python-Werkzeuge wie BCC kombinieren Python häufig mit einem separaten BPF-Programm; eine Python-Datei allein belegt deshalb keine reine Python-Kernelimplementierung. [9]

**Keine C-Codebeispiele im Vortrag.** Die Wirkungsweise im Kernel wird anhand von Ablaufbildern und ausdrücklich als Pseudocode gekennzeichneten Regeln erklärt:

```text
Bei einem neuen Verbindungsaufbau:
    Backend auswählen
    Verbindung diesem Backend zuordnen

Bei einem Paket im XDP-Test:
    wenn TCP-Zielport 9090 und Filter aktiv: DROP zählen und verwerfen
    sonst: PASS zählen und weiterreichen
```

Dieser Pseudocode beschreibt Verhalten, nicht die konkrete Implementierung aller Sicherheitsprüfungen oder die vollständige Logik von Cilium.

## 4. Eigene Folie: Wo große Unternehmen eBPF einsetzen

**Folientitel:** „eBPF in Produktion: konkrete Aufgaben bei großen Unternehmen“

| Unternehmen | Öffentlich dokumentierter Einsatz | Betrieblicher Zweck | Primärquelle |
| --- | --- | --- | --- |
| **Meta** | Katran kombiniert eBPF und XDP im Load-Balancer; Strobelight nutzt unter anderem eBPF-basierte Profiler. | Netzwerkverkehr verteilen und Ressourcenverbrauch von Software untersuchen. | [Katran, 2018](https://engineering.fb.com/2018/05/22/open-source/open-sourcing-katran-a-scalable-network-load-balancer/), [Strobelight, 2025](https://engineering.fb.com/2025/01/21/production-engineering/strobelight-a-profiling-service-built-on-open-source-technology/) |
| **Netflix** | Flow Exporter erfasst TCP-Flows über eBPF-Tracepoints. | Netzwerkbeziehungen und Nutzung für Betrieb und Analyse sichtbar machen. | [Netflix TechBlog, 2021](https://netflixtechblog.com/how-netflix-uses-ebpf-flow-logs-at-scale-for-network-insight-e3ea997dca96) |
| **Microsoft Azure** | Azure CNI powered by Cilium stellt einen eBPF-basierten Datenpfad für AKS bereit. | Netzwerkverarbeitung und Durchsetzung von Netzwerkrichtlinien im verwalteten Cloudprodukt. | [Microsoft Learn](https://learn.microsoft.com/en-us/azure/aks/network-policy-best-practices) |
| **Cloudflare** | L4Drop verwendet eBPF/XDP zur Paketverarbeitung und DDoS-Abwehr. | Angriffsverkehr effizient verwerfen. | [Cloudflare Engineering, 2024](https://blog.cloudflare.com/how-cloudflare-auto-mitigated-world-record-3-8-tbps-ddos-attack/) |


Die Folie beschreibt belegte Einsätze, keine repräsentative Häufigkeitsrangliste. Sie nennt konkrete Produkte beziehungsweise Systeme statt zu behaupten, ein Unternehmen verwende eBPF für seine gesamte Infrastruktur. Ein bestimmter Fortune-500-Rang ist für die Aussage nicht erforderlich. Falls später eine solche Kennzeichnung ergänzt wird, muss sie mit Listenjahr und separater Quelle belegt werden.

## 5. Hauptdemo: Python-Webdienst in einem vorbereiteten k3d-Cluster

### Warum dieser Aufbau?

Ein Cluster macht die drei Effekte gemeinsam sichtbar: mehrere Backend-Instanzen, eine gemeinsame Service-Adresse und erlaubte beziehungsweise blockierte Kommunikation. Hubble liefert dafür eine Service-Map und Flowdetails. Die Zuhörenden benötigen nur das Konzept „mehrere Prozesse hinter einer gemeinsamen Adresse“. Die Installation von Kubernetes und Cilium wird nicht vorgeführt. [5, 6]

**Bevorzugter Aufbau:** k3d in einer vorbereiteten Linux-VM, Cilium mit eBPF-Service-Lastverteilung und Hubble. Ein kleiner Cluster genügt; zusätzliche Nodes werden nur verwendet, wenn sie bei der Probe einen konkreten visuellen Mehrwert liefern. k3d betreibt K3s-Knoten in Containern und verwendet dabei den Linux-Kernel der Umgebung. [10]

```text
Erlaubter Python-Client -----+
                            +--> Service-Adresse --> Python-Backend A
Weiterer Python-Client -----+                    --> Python-Backend B

Cilium: eBPF-Service-Lastverteilung und Netzwerkregel
Hubble: sichtbare Verbindungen, Endpunkte und Policy-Drops
Python: Anfragen, Backend-Antworten und einfache Auswertung
```

Die Clients laufen im Cluster und sprechen den internen Service direkt an. Damit demonstrieren wir den eBPF-Servicepfad, statt versehentlich einen vorgeschalteten k3d-Proxy oder Ingress als Lastverteiler zu zeigen.

### Sichtbarer Anwendungscode

Der Python-HTTP-Server antwortet mit dem Namen seiner Instanz. Der vollständige Server wird vorbereitet; im Vortrag genügt der relevante Ausschnitt. Für den Client reicht sinngemäß:

```python
from collections import Counter
from urllib.request import urlopen

responses = []
for _ in range(20):
    with urlopen("http://web:8080", timeout=2) as response:
        responses.append(response.read().decode().strip())

print(Counter(responses))
```

Der Server liefert in diesem Beispiel einen einfachen Text wie `backend-a`. Das Beispiel setzt voraus, dass jede Iteration eine neue TCP-Verbindung erzeugt; dies wird für die konkrete Implementierung geprüft. Die HTTP-Antwort identifiziert den bedienenden Backend-Prozess.

### Phase A: Beobachten

Beide Clients können zunächst den Webdienst erreichen. Der Python-Client erzeugt kontrolliert Verkehr. Hubble zeigt Kommunikationsbeziehungen und einzelne Flow-Ereignisse. Auf der Theorie-Grafik wird markiert, welche Beobachtungen aus dem eBPF-Datenpfad stammen.

Die Service-Map vermittelt Beziehungen. Welcher konkrete Backend-Pod geantwortet hat, wird an den Antworten und Flowdetails gezeigt; die grafische Karte muss nicht zwei getrennte Backend-Knoten darstellen.

### Phase B: Last verteilen

Mehrere neue Verbindungen gehen an dieselbe Service-Adresse. Beide Backend-Namen tauchen in den Antworten auf. Python fasst die Antworten zusammen. Nicht mit einer garantierten A/B-Abwechslung oder exakt 50:50 argumentieren: Eine kleine Stichprobe und die konfigurierte Auswahlstrategie können ungleiche Ergebnisse liefern. Bei aktivierter Session Affinity wäre auch eine bewusste Bindung möglich; für diesen Versuch wird sie deaktiviert.

**Erklärung:** Die Auswahl geschieht pro Verbindung. HTTP-Anfragen über eine bereits bestehende Verbindung müssen nicht erneut auf ein anderes Backend verteilt werden. Ciliums Socket-LB verwendet eBPF-Hooks zur Umsetzung von Service-Zielen. [7]

### Phase C: Zugriff kontrollieren

Eine kurze vorbereitete Ingress-Regel erlaubt TCP/8080 nur für den als berechtigt markierten Client. Der andere Client wird blockiert. Es wird nur die fachlich relevante Auswahl von Quelle und Port gezeigt, kein langer YAML-Block erklärt.

Nach bestätigter Regelübernahme öffnen beide Clients neue Verbindungen: Der erlaubte Client erhält weiterhin Backend-Antworten; der andere erreicht den Dienst nicht. Hubble zeigt ein Drop-Ereignis mit passendem Policy-Grund. Nach Rücknahme der Regel wird auch dessen Zugriff erneut erfolgreich getestet.

**Erklärung:** Labels dienen hier zur Konfiguration der von Cilium umgesetzten Netzwerkidentitäten. Es handelt sich um Netzwerksicherheit, nicht um eine Anmeldung oder Benutzerberechtigung der HTTP-Anwendung. Regeln für HTTP-Pfade würden zusätzliche Verarbeitung erfordern und bleiben außerhalb des Experiments.

## 6. XDP-Miniversuch: Paketfilterung direkt nachvollziehen

Der XDP-Versuch läuft **separat vom Cluster** auf einem dedizierten veth-Testnetz in derselben Linux-VM. Damit ist eindeutig, welches eigene Programm die Entscheidung trifft. Der Cilium-Datenpfad wird dafür nicht umgebaut.

- Zwei Testdienste auf TCP/8080 und TCP/9090 sind anfangs erreichbar.
- Ein vorbereitetes eBPF-Objekt wird im Generic-/SKB-XDP-Modus am Empfang des Server-veth angebunden.
- Ein kurzes Python-Steuerprogramm aktiviert eine Portregel und liest PASS-/DROP-Zähler aus den Maps, etwa über vorbereitete Aufrufe von `bpftool`.
- TCP/9090 wird blockiert; TCP/8080 bleibt erreichbar. Die Zähler zeigen die Entscheidung.
- Regel zurücknehmen und Wiederherstellung prüfen. Der Vortrag zeigt Python, Pseudocode und Ergebnis; die Erstellung des Kernelobjekts bleibt im vorbereiteten Build.

**Verbindung zum Hauptteil:** Dieselbe eBPF-Grundidee arbeitet hier an einem anderen Einsatzpunkt. Der XDP-Zähler und Hubble haben unterschiedliche Beobachtungspunkte. Die XDP-Drops dieses separaten Versuchs werden deshalb nicht als Hubble-Policy-Drops ausgegeben. [8]

XDP-basierte Lastverteilung wird in der Theorie anhand von Meta/Katran eingeordnet. Der Versuch muss sie nicht zusätzlich selbst implementieren. Ebenso wird nicht behauptet, die Cilium-Ingress-Regel werde durch den eigenen XDP-Filter umgesetzt.

## 7. Testmatrix und technische Vorprobe

| Teil | Vorher / Aktion | Erwarteter Nachweis |
| --- | --- | --- |
| Observability | Beide Clients erzeugen Requests ohne Zugriffseinschränkung | Erfolgreiche Antworten und zugehörige Flow-Ereignisse |
| Load Balancing | Neue Verbindungen über dieselbe interne Service-Adresse | Antworten von beiden Backends und passende Flowdetails |
| Sicherheit | Ingress-Regel aktivieren; neue Verbindungen beider Clients | Nur berechtigter Client erfolgreich; Policy-Drop für anderen Client |
| Wiederherstellung | Regel zurücknehmen | Beide Clients wieder erfolgreich |
| XDP | Beide Ports ohne Blockierung testen, dann 9090 sperren | Vorher erreichbar, danach nur 9090 blockiert; DROP-Differenz steigt |
| XDP zurücksetzen | Regel deaktivieren beziehungsweise Programm lösen | Beide Ports wieder erreichbar |

**Vorbereitung vor dem Bau der Folien:**

1. k3d, K3s, Cilium, Linux-Kernel und Container-Laufzeit gemeinsam testen und eine funktionierende Versionskombination festhalten. Benötigte BPF-/cgroup-Funktionen und Mounts in den k3d-Knoten prüfen.
2. Flannel und den eingebauten K3s-Policy-Controller für Cilium deaktivieren. Für den geplanten eBPF-Servicepfad auch kube-proxy deaktivieren, Ciliums Replacement korrekt konfigurieren und dessen aktiven Zustand prüfen. Die offizielle K3s-Anleitung ist eine Grundlage, kein Nachweis, dass jede k3d-/Desktop-Konfiguration funktioniert. [11]
3. Zwei bereite Backends als Service-Endpunkte, deaktivierte Session Affinity, tatsächliche neue TCP-Verbindungen und Cilium-Servicezustand kontrollieren. So werden die Backend-Antworten dem richtigen Lastverteiler zugeordnet.
4. Hubble Relay/UI und Flowausgabe einschließlich Policy-Drop prüfen. Keine vollständige Sicht auf jedes Paket versprechen; verfügbare Ereignistypen und eventuelle Verluste berücksichtigen.
5. Den separaten Generic-XDP-Versuch mit Python-Steuerung und zeitlich begrenzten Requests vollständig durchspielen. Keine Performanceaussage aus dem virtuellen Aufbau ableiten.
6. Images und Programme vorab bereitstellen; Aufbau/Abbau automatisieren, echte Testausgaben und eine kurze Aufnahme sichern.

Wenn k3d in der vorhandenen Laufzeit keine verlässliche Grundlage bietet, wird der gleiche Anwendungsversuch mit K3s direkt in der Linux-VM durchgeführt. Die didaktische Geschichte und die Python-Beispiele bleiben gleich. Diese technische Auswahl wird während der Vorprobe getroffen.

**Interpretation der Messwerte:** Requests, TCP-Verbindungen und Pakete sind unterschiedliche Größen. Retransmits können mehrere Drops für einen fehlgeschlagenen Verbindungsversuch verursachen. Eine Backend-Antwort belegt erfolgreich bediente Kommunikation; ein Auswahlereignis allein noch keinen Erfolg. Die geplanten Zähler messen keine vollständige HTTP-Latenz.

## 8. Cilium begrenzen und Überschneidung vermeiden

Cilium und Hubble erhalten in der Theorie keine eigene ausführliche Produktvorstellung. Sie werden auf der Unternehmensfolie bei Microsoft und bei der etwa einminütigen Einführung des Labors eingeordnet. In der Praxis werden ihre Ergebnisse konsequent auf die vorher erklärten eBPF-Bausteine zurückgeführt.

Kubernetes ist der Versuchsaufbau. Erklärt werden lediglich eine gemeinsame Service-Adresse, zwei Backend-Instanzen und zwei Clients. CNI-Spezifikation, Cluster-Routing, Overlays, Service Mesh, Sidecars, Gateway API und Installation bleiben außerhalb des Vortrags. So verdrängt das Werkzeug weder eBPF noch das Thema des anderen Referats.

## 9. Abschluss, Abgaben und Fragen

**Drei Kernaussagen:**

1. eBPF ermöglicht Beobachtung und Entscheidungen an unterschiedlichen Ereignissen im Kernel.
2. Große Unternehmen setzen diese Grundlage für konkrete Aufgaben ein: Flowanalyse, Lastverteilung, Profiling und Angriffsabwehr.
3. Der Hook bestimmt die Sicht und die Möglichkeiten; ein XDP-Paketfilter, ein Socket-Load-Balancer und eine Netzwerkregel sind unterscheidbare Mechanismen.

**Abgaben:** Folien mit belegten Unternehmenseinsätzen, Handout mit textueller Erklärung und Quellen, Python-Anwendung und Client, kurze Regelkonfiguration, reproduzierbarer Laboraufbau, XDP-Objekt samt reproduzierbarem Build und Lizenznachweisen, dokumentierte Tests sowie drei Fragen mit Antworten. Das Handout wird vor dem Vortrag verteilt.

**1. Welche Aufgaben haben Hooks, Verifier, JIT und Maps bei eBPF?**

Hooks bestimmen Ausführungszeitpunkt und Kontext. Der Verifier prüft die Zulässigkeit des Programms, etwa Speicherzugriffe. Der JIT übersetzt Bytecode auf unterstützten Systemen in Maschinencode. Maps speichern Zustand, Konfiguration und Messwerte und ermöglichen Zugriff aus dem Userspace. [1, 2]

**2. Nenne zwei konkrete Produktionseinsätze von eBPF und erkläre deren Zweck.**

Beispielsweise Meta/Katran für Netzwerk-Lastverteilung und Netflix/Flow Exporter für die Erfassung und Analyse von TCP-Flows. Weitere vermittelte Beispiele sind Cloudflare/L4Drop zur DDoS-Abwehr sowie Microsofts eBPF-basierter Cilium-Datenpfad in AKS. Die Antwort soll jeweils Unternehmen, System und Aufgabe verbinden. [3, 4, 12, 13]

**3. Warum wird pro TCP-Verbindung ein Backend gewählt, und wie unterscheiden sich die Nachweise für Lastverteilung und Filterung?**

Pakete derselben TCP-Verbindung müssen zum passenden Backend gelangen. Viele HTTP-Anfragen können eine Verbindung teilen. Für die Lastverteilung werden deshalb neue Verbindungen erzeugt und Backend-Antworten ausgewertet. Für Filterung wird der vorher erfolgreiche Zugriff eingeschränkt und mit einem passenden Drop-Ereignis beziehungsweise XDP-Zähler geprüft; ein weiterhin erlaubter Zugriff und die Wiederherstellung ergänzen den Nachweis.

## 10. Referenzen

Geprüft am 17.10.2026. Unternehmensbeispiele und dokumentierte Zeitpunkte sind auf Folie 7 verlinkt. Bei der Implementierung werden zusätzlich konkrete Versionsangaben und die verwendeten Codequellen festgehalten.

1. [eBPF.io: What is eBPF?](https://ebpf.io/what-is-ebpf/) — Grundlagen, Maps und Laufzeit.
2. [Linux-Kernel-Dokumentation: eBPF verifier](https://docs.kernel.org/bpf/verifier.html) — Prüfung von Programmzuständen und Speicherzugriffen.
3. [Meta: Open-sourcing Katran](https://engineering.fb.com/2018/05/22/open-source/open-sourcing-katran-a-scalable-network-load-balancer/) — Load Balancing mit eBPF/XDP.
4. [Netflix: eBPF flow logs at scale](https://netflixtechblog.com/how-netflix-uses-ebpf-flow-logs-at-scale-for-network-insight-e3ea997dca96) — Netzwerk-Observability.
5. [Cilium: Network Observability with Hubble](https://docs.cilium.io/en/stable/observability/hubble/index.html) — Flow-Sicht und Komponenten.
6. [Cilium: Service Map & Hubble UI](https://docs.cilium.io/en/stable/observability/hubble/hubble-ui/) — Visuelle Kommunikationsbeziehungen.
7. [Cilium: Kubernetes Without kube-proxy](https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/) — Socket-LB und optionale XDP-Beschleunigung.
8. [XDP-Projekt: XDP Programming Hands-On Tutorial](https://github.com/xdp-project/xdp-tutorial) — PASS/DROP, Generic-XDP, Maps und Testnetze.
9. [BCC: Python Hello World](https://github.com/iovisor/bcc/blob/master/examples/hello_world.py) — Beispiel für die Trennung von Python und BPF-Programm.
10. [k3d: Projektdokumentation](https://k3d.io/stable/) — K3s-Knoten in Containern.
11. [Cilium: Installation Using K3s](https://docs.cilium.io/en/stable/installation/k3s/) — Voraussetzungen und Konfiguration der K3s-Grundlage.
12. [Cloudflare: DDoS mitigation with XDP/eBPF](https://blog.cloudflare.com/how-cloudflare-auto-mitigated-world-record-3-8-tbps-ddos-attack/) — L4Drop in der Angriffsabwehr.
13. [Microsoft: AKS network security best practices](https://learn.microsoft.com/en-us/azure/aks/network-policy-best-practices) — Azure CNI powered by Cilium.
14. [Meta: Strobelight](https://engineering.fb.com/2025/01/21/production-engineering/strobelight-a-profiling-service-built-on-open-source-technology/) — Profiling mit unter anderem eBPF-basierten Profilern.

**Stand:** Inhaltliche Planung nach dem Feedback. Cluster, Python-Anwendungen, XDP-Steuerung, Folien und Handout sind noch zu erstellen. Die Testmatrix ist noch nicht ausgeführt; k3d-Kompatibilität und Beobachtungspunkte sind ausdrücklich Teil der technischen Vorprobe.
