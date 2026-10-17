# Prüfung der Präsentationsansicht

Stand: 17.10.2026. Nach der Überarbeitung von Website-Navigation zu einer festen Folien- und Referentenansicht.

## Im Browser geprüft

| Größe      | Prüfung                                                 | Ergebnis                                                                      |
| ---------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1135 × 853 | Alle 15 Folien; 22-Pixel-Sprechtext                     | Kein Seiten- oder Sprechtextüberlauf; Folieninhalt im festen 16:9-Raster      |
| 1280 × 720 | Alle Sprechtextabschnitte aller 15 Folien bei 30 Pixeln | Jeder angezeigte Abschnitt passt; Wechsel über Abschnittspfeile ohne Scrollen |
| 390 × 844  | Gestapelte Referentenansicht, 22-Pixel-Sprechtext       | Kein horizontaler oder vertikaler Seitenüberlauf; Text in Abschnitten         |
| 1600 × 900 | Separate Zuschaueransicht                               | Reine Folie, keine Notizen oder Simulationssteuerung                          |
| 1600 × 900 | Alle drei Antworten eingeblendet                        | Inhalt passt vollständig auf die Fragenfolie                                  |
| 1600 × 900 | XDP-Demo mit Ereignissen                                | Zähler, Ereignistabelle und Stichpunkte überlappen nicht                      |

Synchronisierung wurde in zwei getrennten Browser-Tabs desselben Profils geprüft: Folienwechsel, PASS-/DROP-Zähler, Portwahl, Antworten und Schwarzbild. Beispiel XDP: ein erlaubtes Paket an 9090 vor der Sperre, zehn verworfene Pakete an 9090 nach der Sperre, ein erlaubtes Paket an 8080 ergeben 12 gesendete Pakete, 2 PASS und 10 DROP.

Die Sprechtextprüfung misst den verfügbaren Bereich und den tatsächlichen Textüberlauf im Browser. Bei großer Schrift werden die mitgelieferten Texte auf mehrere Abschnitte verteilt. Die Schrift wird nicht automatisch verkleinert.

## Technisch geprüft

- TypeScript-Prüfung und Vite-Produktionsbuild erfolgreich.
- Vier Tests für Filterentscheidungen, Netzwerkregel, Zähler und gespeicherten Zustand erfolgreich.
- Simulierte Service-Verbindungsversuche beziehen sich auf den Dienstport 8080; XDP-Pakete auf den gewählten Port.

Die Prüfung verwendet Browserfenster. Das manuelle Verschieben auf einen physischen zweiten Monitor und das Teilen über eine Konferenz-App hängen vom jeweiligen macOS-/Browser-Setup ab. Ein echter Linux-eBPF-Datenpfad ist nicht Bestandteil dieser Browser-Simulation.
