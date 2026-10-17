# eBPF im Linux-Netzwerk

Eine Präsentationswebsite mit festem 16:9-Format, großen Referentennotizen und synchronisierter Zuschaueransicht. React, TypeScript und Vite. Der Praxisteil verbindet echte Python-/YAML-Dateien mit einem lokalen **k3d + Cilium + Hubble**-Labor.

## Start

Node.js 22.12+ und npm:

```sh
npm ci
npm run dev
```

Öffnen: http://127.0.0.1:5173/. Die Folien funktionieren auch ohne Labor; Ausführungsbuttons sind dann deaktiviert und als offline gekennzeichnet. Es gibt keine simulierten Ersatzresultate.

Für das Linux-Labor zusätzlich Docker, k3d, kubectl, Helm, Python 3 und curl bereitstellen. Docker Desktop stellt auf macOS den Linux-Kernel zur Verfügung.

```sh
npm run lab:setup
```

Anschließend in einem zweiten Terminal:

```sh
npm run lab
```

Das startet die lokale Befehlsbrücke und Portweiterleitungen. Hubble UI: http://127.0.0.1:12000/?namespace=ebpf-talk. Einrichtung, Ablauf und technische Grenzen stehen in [lab/README.md](lab/README.md).

## Präsentieren auf zwei Displays

1. macOS auf **erweiterten Bildschirm** stellen.
2. In der Website **Präsentieren** wählen.
3. Das Zuschauerfenster auf den externen Bildschirm ziehen und dort **F** drücken.
4. Das MacBook behält die Referentenansicht mit Sprechtext und Laborsteuerung.

Bei einer Videokonferenz das Zuschauerfenster in der Konferenzsoftware teilen. Die Website selbst zeichnet den Desktop nicht auf.

Notizen sind standardmäßig 22 CSS-Pixel groß, mit A−/A+ von 18 bis 30 einstellbar. Lange Texte werden in sichtbare Abschnitte aufgeteilt. Notizen lassen sich bearbeiten und bleiben lokal gespeichert. Beide Ansichten müssen im selben Browserprofil unter demselben Ursprung laufen.

Folien, Code-Datei/-Seite, ausgewählte Ansicht, Messergebnis, Flow-Auswahl und Schwarzbild werden über BroadcastChannel/localStorage synchronisiert. Die Hubble-UI-Instanzen sehen denselben Live-Verkehr; interne Hubble-Auswahl, Zoom und Filter werden von Hubble selbst verwaltet und sind **nicht** zwischen Fenstern gekoppelt. Für eine identische Flow-Auswahl auf beiden Displays die integrierte Ansicht **Flowdetails** verwenden.

| Taste                           | Funktion                           |
| ------------------------------- | ---------------------------------- |
| ← / →, Bild↑ / Bild↓, Leertaste | Folien wechseln                    |
| Pos1 / Ende                     | Erste / letzte Folie               |
| ↑ / ↓                           | Sprechtextabschnitt wechseln       |
| N                               | Notizen ein-/ausblenden            |
| B                               | Zuschauerbild schwarz / fortsetzen |
| F                               | Vollbild                           |
| ?                               | Hilfe                              |

## Praxis: Code → Ausführung → Nachweis

- **A · Beobachten:** `server.py` lesen, Client ausführen, Request-ID in Antwort und Backend-Log finden, Hubble-Flow zuordnen.
- **B · Verteilen:** fünf HTTP-Anfragen über eine Verbindung mit zehn neu aufgebauten Verbindungen vergleichen. Backend-Namen sind gemessen; es gibt keine festgelegte Verteilungsfolge.
- **C · Netzwerkregel:** offene Policy → B erfolgreich → `role: trusted` ergänzen → B Timeout / Hubble `POLICY_DENIED` → A erfolgreich → offene Policy → B wieder erfolgreich.
- **D · Kernelzustand:** echte Pod-/Service-Adressen, Endpoint-Identitäten, BPF-LB-Map und BPF-Policy-Maps vergleichen.

**Code groß** zeigt den Quelltext für das Publikum vergrößert. Die Dateiansicht ist paginiert; Zeilennummern beziehen sich auf die vollständige Datei. **Code + Ergebnis**, **Originalausgabe**, **Hubble UI**, **Flowdetails** und **Backend-Logs** stellen unterschiedliche Nachweise dar. Die Messungsauswahl erlaubt den Vergleich vorheriger Befehle innerhalb der Sitzung. Vollständige Protokolle liegen lokal unter `lab/evidence/` (Git-ignoriert).

Der separate animierte XDP-Versuch wurde entfernt. XDP wird fachlich erklärt; die ausführbare Filterdemonstration verwendet Cilium-Policy im TC-Datenpfad.

## Gestaltung und Originalgrafiken

Die Cilium-Hero-/Use-Case-Komponenten wurden anhand ihrer Originalquellen übertragen. Die technischen Folien verwenden Cloudflare Docs' originale OKLCH-Farben, Typografie, Codeflächen und Komponentenmaße, vergrößert für die Projektion. Originalgrafiken von Cilium ersetzen die nachgezeichneten Illustrationen. Herkunft, Lizenzen und Anpassungen stehen in [public/vendor/ATTRIBUTION.md](public/vendor/ATTRIBUTION.md); der konkrete Abgleich in [docs/DESIGN-ANALYSE.md](docs/DESIGN-ANALYSE.md).

## Prüfungen und Abgabe

```sh
npm test
npm run build
# Bei laufendem Labor und laufender Brücke:
npm run lab:verify
```

Der Live-Test prüft Ausgangszustand, Request-ID-Korrelation, Keep-alive, neue Verbindungen, Policy-Drop, erlaubte Kontrolle, BPF-Maps und Wiederherstellung. Er setzt abschließend die offene Policy. Die Pipeline führt die lokalen Tests und den Build aus; ein Docker-Labor ist nicht Teil des GitHub-CI-Jobs.

15 Folien, Richtzeit insgesamt 23:30 einschließlich Diskussion. Unter **Folien → Handout herunterladen** entsteht ein Markdown-Handout mit Folienpunkten, Standardsprechtexten, drei Fragen/Antworten und Quellen. Individuell bearbeitete Notizen werden nicht exportiert. Die ursprünglichen Vorgaben und die frühere Planung bleiben unter `docs/` als Projektunterlagen erhalten.
