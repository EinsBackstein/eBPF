# eBPF im Linux-Netzwerk

Eine Präsentationswebsite mit festem 16:9-Format, großen Referentennotizen und synchronisierter Zuschaueransicht. React, TypeScript und Vite. Der Praxisteil verbindet echte Python-/YAML-Dateien mit einem lokalen **k3d + Cilium + Hubble**-Labor sowie einem eigenen XDP-Portfilter.

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

Folien, Code-Datei und Scrollposition, ausgewählte Ansicht, Messergebnis, Flow-Auswahl und Schwarzbild werden über BroadcastChannel/localStorage synchronisiert. Die integrierte Ansicht **Flowdetails** zeigt die erfassten Hubble-Ereignisse mit synchronisierter Auswahl. Die native Hubble UI bleibt bei Bedarf separat unter der oben genannten Laboradresse verfügbar.

| Taste                           | Funktion                           |
| ------------------------------- | ---------------------------------- |
| ← / →, Bild↑ / Bild↓, Leertaste | Folien wechseln                    |
| Pos1 / Ende                     | Erste / letzte Folie               |
| ↑ / ↓                           | Sprechtextabschnitt wechseln       |
| N                               | Notizen ein-/ausblenden            |
| B                               | Zuschauerbild schwarz / fortsetzen |
| F                               | Vollbild                           |
| ?                               | Hilfe                              |
