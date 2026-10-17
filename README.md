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

Beide Fenster müssen dieselbe URL-Basis und dasselbe Browserprofil verwenden. `BroadcastChannel` synchronisiert Folien, Antworten, Simulationszustand und Schwarzbild. `localStorage` dient als Fallback und stellt die letzte Folie wieder her. Eine Verbindung zu fremden Geräten ist nicht vorgesehen; pro Sitzung nur eine Referentenansicht verwenden.

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

## Interaktive Simulation

**Die Website führt kein eBPF aus und misst keinen echten Netzwerkverkehr.** Der k3d-/Cilium-/Hubble-Aufbau und der separate XDP-Versuch sind noch umzusetzen; die Planung steht in [docs/INHALTSPLAN.md](docs/INHALTSPLAN.md).

Die Steuerung erscheint auf dem MacBook unter der aktuellen Praxisfolie:

- **A · Beobachten:** Neue Verbindungen erzeugen und Quelle, Entscheidung und Backend zuordnen.
- **B · Lastverteilung:** Neue Verbindungen bekommen zufällig Backend A oder B; die Stichprobe muss nicht 50:50 sein.
- **C · Netzwerkregel:** Nur Client A erlauben, Client B prüfen, Regel deaktivieren und Zugriff erneut prüfen.
- **D · XDP-Portfilter:** 9090 sperren, TCP/9090 und TCP/8080 vergleichen, PASS-/DROP-Zähler verfolgen, Filter deaktivieren und wiederholen.

Zwischen XDP-Modell und den übrigen Folien werden Zustand und Zähler zurückgesetzt, damit Paket- und Verbindungszähler nicht vermischt werden. Die übrigen Praxisphasen teilen ihren Zustand. **Zurücksetzen** stellt den Ausgangszustand her. XDP-Drops und Cilium-Policy-Drops beschreiben unterschiedliche Mechanismen.

Die vereinfachte Portregel ist Pseudocode, kein vollständiger Paketparser. Im echten Versuch gehören Kontrollzugriff und Wiederherstellung zum Nachweis. Requests, Verbindungen und Pakete dürfen nicht gleichgesetzt werden.

## Dateien

- `src/deck.ts`: Folientitel, Stichpunkte, Sprechtexte, Fragen und Primärquellen.
- `src/App.tsx`: feste Folienansicht, Referentenansicht, Pagination und Synchronisierung.
- `src/model.mjs`: Simulations- und Zustandslogik.
- `src/styles.css`: Darstellung und festes 1600 × 900-Folienraster.
- `docs/`: ursprüngliche Referatsvorgaben und Inhaltsplan.

Schriftarten werden lokal gebündelt (DM Sans, IBM Plex Mono), Icons stammen von Lucide. Zum Präsentieren ist nach dem lokalen Start keine Internetverbindung erforderlich; externe Quellenlinks benötigen Internetzugang.

Die ursprünglichen Vorgaben nennen 25 Minuten; die erweiterte Planung sieht etwa 36 Minuten vor. Zeitrahmen und Verwendung einer Website anstelle von Folien sind entsprechend den Vorgaben mit der Lehrperson abzustimmen.
