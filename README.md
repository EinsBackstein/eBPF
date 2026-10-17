# eBPF — Inside the kernel

Eine interaktive Präsentationswebsite für das Referat **„eBPF: Netzwerkverkehr beobachten, verteilen und absichern“**. React 19, TypeScript und Vite; statische Website ohne Backend und ohne ChatGPT-Sites-Abhängigkeit.

## Lokal starten

Node.js **22.12+** (oder 20.19+) und npm verwenden.

```sh
npm ci
npm run dev
```

Die ausgegebene lokale URL im Browser öffnen (standardmäßig `http://127.0.0.1:5173`).

```sh
npm test        # Entscheidungslogik, Zähler und Validierung des gespeicherten Zustands
npm run build  # TypeScript-Prüfung + statischer Produktionsbuild nach dist/
npm run preview
```

`dist/` kann bei einem beliebigen statischen Webhost bereitgestellt werden. Relative Assetpfade unterstützen auch Unterverzeichnisse. Es ist kein Hostingdienst vorkonfiguriert.

## Präsentieren auf dem MacBook

1. Unter **Systemeinstellungen → Displays** den zweiten Bildschirm als **erweiterten Bildschirm** verwenden.
2. Website auf dem MacBook öffnen und **Präsentieren** anklicken. Popups für die lokale Website erlauben, falls der Browser sie blockiert.
3. Das neue Zuschauerfenster auf den zweiten Bildschirm ziehen. Im Zuschauerfenster mit **F** Vollbild aktivieren; alternativ das Vollbild-Menü des Browsers verwenden.
4. Auf dem MacBook bleiben Foliensteuerung, bearbeitbarer Sprechtext, Timer und eine Vorschau der nächsten Folie sichtbar. Im Zuschauerfenster werden Folie und synchronisierte Simulation angezeigt.
5. In einer Videokonferenz **nur das Zuschauerfenster bzw. den zweiten Bildschirm** teilen.

Die Website öffnet eine separate Ansicht; das eigentliche Bildschirmteilen übernimmt macOS beziehungsweise die Konferenz-App. Das Verschieben auf einen externen Monitor erfolgt manuell und funktioniert damit auch ohne experimentelle Browser-APIs.

Alternative Einstiege: `?view=presenter` und `?view=audience`. Beide Fenster müssen dieselbe URL-Basis, denselben Browser und dasselbe Browserprofil verwenden (nicht ein privates und ein normales Fenster mischen). `BroadcastChannel` synchronisiert Folien, Simulation, eingeblendete Antworten und Schwarzbild; `localStorage` dient als Fallback und stellt die letzte Folie wieder her. Eine Verbindung zu fremden Geräten ist nicht vorgesehen. Pro Sitzung eine Referentenansicht verwenden.

| Taste                    | Funktion                                    |
| ------------------------ | ------------------------------------------- |
| → / Leertaste / PageDown | Nächste Folie                               |
| ← / PageUp               | Vorherige Folie                             |
| Home / End               | Erste / letzte Folie                        |
| N                        | Sprechtext ein-/ausblenden                  |
| B                        | Zuschauerbild schwarz schalten / fortsetzen |
| F                        | Vollbild im aktuellen Fenster               |
| ?                        | Hilfe                                       |

Sprechtext lässt sich direkt bearbeiten und wird nur lokal im Browser gespeichert. Er wird nicht an das Zuschauerfenster übertragen. Der Timer ist lokal zur Referentenansicht. Mit **Handout herunterladen** wird ein Markdown-Dokument mit Zusammenfassung, Fragen und Quellen erstellt; es verwendet die mitgelieferten Texte, keine lokalen Sprechtextänderungen.

## Interaktiver Praxisteil · erste Iteration

**Alle angezeigten Ereignisse sind Browser-Simulationen. Die Website führt kein eBPF aus, misst keinen echten Netzwerkverkehr und steuert noch kein Linux-Labor.**

- **A · Beobachten:** Verbindungen erzeugen und modellierte Entscheidungen ansehen.
- **B · Verteilen:** Neue Verbindungen bekommen zufällig Backend A oder B. Es gibt keine garantierte 50:50-Verteilung.
- **C · Absichern:** Ingress-Policy aktivieren, Client B blockieren, Client A als Kontrolle prüfen und die Policy wieder deaktivieren.
- **D · XDP-Paketfilter:** Filter aktivieren. TCP/9090 wird verworfen, TCP/8080 bleibt erlaubt. PASS-/DROP-Zähler und Ereignislog verfolgen. Filter deaktivieren und Wiederherstellung prüfen.

Beim Wechsel zwischen dem XDP-Modell und den anderen Folien werden Simulationszustand und Zähler zurückgesetzt, damit keine Messgrößen vermischt werden. Die übrigen Praxisphasen teilen ihren Zustand. **Zurücksetzen** stellt jeweils den Ausgangszustand her.

Der Pseudocode erklärt Verhalten und ist kein vollständiger Paketparser. XDP-Drops sind von Cilium-Policy-Drops getrennt. Das geplante reale k3d-/Cilium-/Hubble-Labor und der separate Generic-XDP-Versuch sind in [docs/INHALTSPLAN.md](docs/INHALTSPLAN.md) beschrieben und noch nicht implementiert.

## Inhalte anpassen

- `src/deck.ts`: Folien, Sprechtexte, Fragen und Primärquellen.
- `src/App.tsx`: Ansichten, Synchronisierung und Interaktionen.
- `src/model.mjs`: reine Simulations- und Zustandslogik.
- `src/styles.css`: Gestaltung und responsive Layouts.
- `docs/`: ursprüngliche Referatsvorgaben und Inhaltsplan.

Gestaltung inspiriert von [Cilium](https://cilium.io/) und [Cloudflare Docs](https://developers.cloudflare.com/); keine offizielle Verbindung. Schriftarten: DM Sans, Manrope, IBM Plex Mono (lokal gebündelt). Icons: Lucide.

Die mitgelieferte Planung sieht etwa 36 Minuten vor; die ursprünglichen Vorgaben nennen 25 Minuten. Zeitrahmen und die Verwendung einer Website anstelle von Folien vorab mit der Lehrperson abstimmen, wie in den Vorgaben festgehalten.
