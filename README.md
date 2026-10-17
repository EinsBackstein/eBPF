# eBPF im Linux-Netzwerk

Eine Präsentation im Browser mit festem **16:9-Folienformat**, Referentenansicht und synchronisierter Zuschaueransicht. React 19, TypeScript und Vite; statisch und ohne Backend.

## Starten

Node.js **22.12+** (oder 20.19+) und npm:

```sh
npm ci
npm run dev
```

Die lokale URL öffnen (standardmäßig `http://127.0.0.1:5173`). Die Referentenansicht zeigt die aktuelle Folie links und den Sprechtext rechts. Die Folienübersicht wird über **Folien** geöffnet; es gibt keine Website-Navigation oder dauerhaft sichtbare Seitenleiste.

```sh
npm test
npm run build
npm run preview
```

Der Build liegt in `dist/` und kann bei einem statischen Webhost bereitgestellt werden. Relative Assetpfade unterstützen auch Unterverzeichnisse. Es ist kein Hostingdienst vorkonfiguriert.

## Auf dem MacBook präsentieren

1. In macOS unter **Systemeinstellungen → Displays** den zweiten Bildschirm als **erweiterten Bildschirm** einstellen.
2. **Präsentieren** anklicken. Das Zuschauerfenster auf den zweiten Bildschirm ziehen und dort mit **F** Vollbild aktivieren.
3. Auf dem MacBook bleiben Foliensteuerung, Timer, Sprechtext und der Titel der nächsten Folie sichtbar.
4. In einer Videokonferenz **nur das Zuschauerfenster oder den zweiten Bildschirm** teilen. Das Bildschirmteilen selbst übernimmt die Konferenz-App.

Falls Popups blockiert werden, in der **Hilfe** die Zuschaueransicht als Tab öffnen. Direkte Einstiege: `?view=presenter` und `?view=audience`.

Beide Fenster müssen dieselbe URL-Basis und dasselbe Browserprofil verwenden. `BroadcastChannel` synchronisiert Folien, Antworten, Simulationszustand und Schwarzbild. `localStorage` dient als Fallback und stellt die letzte Folie wieder her. Eine Verbindung zu fremden Geräten ist nicht vorgesehen. Bei mehreren Referentenfenstern übernimmt das zuletzt bediente Fenster die Steuerung, damit inaktive Tabs die Zuschaueransicht nicht zurücksetzen. Für den Vortrag wird eine Referentenansicht empfohlen.

## Sprechtext ohne Scrollen

- Der Sprechtext hat einen festen Platz im Fenster und ist standardmäßig **22 CSS-Pixel** groß.
- **A− / A+** ändern die Größe zwischen 18 und 30 Pixeln.
- Die verfügbare Breite und Höhe werden gemessen. Längere Texte erscheinen in **Abschnitten**, die jeweils vollständig in den sichtbaren Bereich passen. Es gibt keine Scrollleiste im Sprechtext.
- Mit **↑ / ↓** oder den Pfeilen unter dem Text zwischen Abschnitten wechseln. Beim Folienwechsel beginnt der Sprechtext wieder beim ersten Abschnitt.
- Über das **Stiftsymbol** lässt sich der Text in einem separaten Dialog bearbeiten. Änderungen bleiben lokal im Browser und werden nicht an Zuschauer übertragen.
- Auf schmalen Geräten stehen Folie und Sprechtext übereinander, jeweils in festen Bereichen.

| Taste                    | Funktion                                    |
| ------------------------ | ------------------------------------------- |
| → / Leertaste / PageDown | Nächste Folie                               |
| ← / PageUp               | Vorherige Folie                             |
| ↑ / ↓                    | Sprechtextabschnitt zurück / weiter         |
| Home / End               | Erste / letzte Folie                        |
| N                        | Sprechtext ein-/ausblenden                  |
| B                        | Zuschauerbild schwarz schalten / fortsetzen |
| F                        | Vollbild im aktuellen Fenster               |
| ?                        | Hilfe                                       |

Die Zuschaueransicht zeigt ausschließlich die Folie. Sie wird proportional in das Fenster eingepasst, ohne dass Inhalte umgebrochen oder abgeschnitten werden. Bei abweichendem Bildschirmformat bleiben schwarze Ränder.

## Folieninhalte

15 Folien behandeln Grundprinzip, Laden und Ausführen, Verifier/JIT, Maps, Hooks, konkrete Unternehmenseinsätze, Versuchsaufbau, vier Praxisphasen, Testmatrix, Wiederholungsfragen und Quellen.

Die Texte erklären konkrete Abläufe und Beispiele. Folien und gesprochene Erläuterung sind getrennt. Über **Folien → Handout herunterladen** wird ein Markdown-Handout mit Folienpunkten, mitgelieferten Sprechtexten, drei Fragen mit Antworten und Quellen erzeugt. Lokale Sprechtextänderungen werden nicht in das Handout übernommen.

## Geführte Experimente

Die vier Praxisfolien enthalten unterschiedliche Experimente statt eines gemeinsamen Zählers. Über **Versuch auswählen** zwischen den Fällen wechseln. Jeder Fall beginnt mit einer Frage an die Zuschauer; über **A / B** kann eine Vorhersage festgehalten werden.

- **Nächster Schritt / Zurück:** Paket oder Verbindung schrittweise durch den Ablauf verfolgen. Jeder Schritt zeigt eine Erklärung, den aktiven Pfad sowie die passenden Paket-, Regel- oder Ergebnisfelder.
- **Wiedergabe:** Schritte im Abstand von 2,4 Sekunden abspielen; jederzeit pausierbar. Sie endet bei der Auswertung und startet keinen neuen Fall automatisch.
- **Nächster Versuch:** Zum nächsten Vergleich wechseln. Die abgeschlossenen Policy-/XDP-Fälle werden bis zum Folienwechsel als Vergleich festgehalten.
- **Zurücksetzen:** Aktuellen Fall wieder bei der Vorhersage beginnen. Beim Folienwechsel wird das Experiment neu initialisiert.

| Praxisfolie    | Sichtbarer Vergleich                                                   | Lernziel                                                                                 |
| -------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Observability  | Service-Ziel → Backend-Zuordnung → HTTP-Antwort                        | Die Service-Adresse allein nennt den antwortenden Prozess nicht.                         |
| Load Balancing | 5 Requests auf 1 Verbindung vs. 5 neue Verbindungen                    | Das Backend wird je neuer TCP-Verbindung gewählt. Keep-alive behält die Zuordnung.       |
| Network Policy | Client B vorher, blockiert, Client A erlaubt, Client B wieder erlaubt  | Ein Policy-Drop erreicht den HTTP-Dienst nicht und produziert keinen HTTP-403-Status.    |
| XDP            | 9090 ohne Filter, 9090 gesperrt, 8080 erlaubt, 9090 wieder freigegeben | Regel-Map und Paketkontext führen zu PASS/DROP. XDP_PASS belegt noch keine HTTP-Antwort. |

Die Backend-Folge der fünf neuen Verbindungen ist ein festes Beispiel A/B/B/A/B. Sie garantiert keine Verteilungsquote eines realen Load-Balancers. Die Beispiele setzen inhaltlich voraus, dass ein gültiger TCP-Header bereits sicher gelesen werden kann; der Pseudocode ist kein vollständiger Parser.

**Die Website führt kein eBPF aus und misst keinen echten Netzwerkverkehr.** Der k3d-/Cilium-/Hubble-Aufbau und der separate XDP-Versuch sind noch umzusetzen; die Planung steht in [docs/INHALTSPLAN.md](docs/INHALTSPLAN.md).

## Dateien

- `src/deck.ts`: Folientitel, Stichpunkte, Sprechtexte, Fragen und Primärquellen.
- `src/App.tsx`: feste Folienansicht, Referentenansicht, Pagination und Synchronisierung.
- `src/experiment-model.mjs`: deterministische Abläufe, Entscheidungen und Zustandsvalidierung.
- `src/Experiments.tsx`: Zuschauerfragen, Paketpfade, Inspector und Wiedergabesteuerung.
- `src/Illustrations.tsx`: eigene SVG-Schichtenillustration.
- `src/theme.css`: aus der Referenzanalyse abgeleitete Typografie, Farben und Diagrammstile.
- `src/styles.css`: Darstellung und festes 1600 × 900-Folienraster.
- `docs/`: ursprüngliche Referatsvorgaben und Inhaltsplan.

Die Gestaltung ist an Cilium und Cloudflare Docs angelehnt; die detaillierte [Referenzanalyse](docs/DESIGN-ANALYSE.md) dokumentiert die Beobachtungen und ihre Umsetzung. Schriftarten werden lokal gebündelt (Inter, JetBrains Mono), Icons stammen von Lucide. Zum Präsentieren ist nach dem lokalen Start keine Internetverbindung erforderlich; externe Quellenlinks benötigen Internetzugang.

Die ursprünglichen Vorgaben nennen 25 Minuten; die erweiterte Planung sieht etwa 36 Minuten vor. Zeitrahmen und Verwendung einer Website anstelle von Folien sind entsprechend den Vorgaben mit der Lehrperson abzustimmen.
