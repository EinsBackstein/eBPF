# Prüfung der Präsentationsansicht

Stand: 17.10.2026, nach der gestalterischen und didaktischen Überarbeitung anhand von Cilium und Cloudflare Docs. Siehe [Designanalyse](DESIGN-ANALYSE.md).

## Browserprüfung

| Prüfung                                                                                  | Ergebnis                                                                                                               |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Alle 12 Versuchsvarianten und alle 68 Ablaufschritte in der Zuschaueransicht, 1600 × 900 | Inspector, Diagramm und Auswertung passen in das feste Folienformat; keine Überdeckung des Quellenfußes.               |
| Fünf Requests mit einer TCP-Verbindung                                                   | Alle Requests zeigen conn-01 und Backend A.                                                                            |
| Fünf Requests mit fünf TCP-Verbindungen                                                  | Fünf conn-IDs; festes Beispiel A/B/B/A/B; zwei Backends sichtbar.                                                      |
| Automatische Wiedergabe                                                                  | Schritt wird nach 2,4 Sekunden weitergeschaltet; Pause hält den aktuellen Schritt.                                     |
| Getrenntes Zuschauerfenster                                                              | Folie, Versuch, Fortschritt und Ergebnisse sind synchron; Notizen und Experimentsteuerung werden nicht gerendert.      |
| Zwei Referentenfenster                                                                   | Die Zuschaueransicht folgt dem zuletzt bedienten Fenster; ein inaktives Fenster setzt sie beim Heartbeat nicht zurück. |
| 1280 × 720, Inter mit 30-Pixel-Sprechtext, alle 15 Folien und sämtliche Textabschnitte   | Kein Text- oder Seitenüberlauf; jeder Sprechtextabschnitt passt ohne Scrollen.                                         |
| 390 × 844                                                                                | Kompakte Referentenansicht: Experimentsteuerung bleibt oberhalb der Notizen sichtbar, ohne Seiten- oder Textüberlauf.  |
| 1135 × 853                                                                               | Referentenlayout mit fester Notizenspalte und separater Experimentsteuerung unter der Folie sichtbar.                  |

Die Bildschirmprüfung verwendet DOM-Abmessungen zusätzlich zur visuellen Kontrolle. Die Schriften werden lokal geladen. Die SVG-Bewegung wird bei aktivierter Einstellung für reduzierte Bewegung ausgeblendet; die statische Pfadmarkierung und die Texte bleiben erhalten.

## Modelltests

Sieben Tests prüfen:

1. Wiederverwendung einer Verbindung mit unverändertem Backend.
2. Neue Verbindungen mit separaten Backend-Zuordnungen.
3. Policy ohne Regel, gesperrter Client, erlaubter Kontrollclient und Wiederherstellung.
4. XDP-Filter auf 9090, Kontrollport 8080 und Rücknahme. XDP_PASS erzeugt keine erfundene HTTP-Antwort.
5. Beobachtung einer Antwort erst nach der Zuordnung.
6. Vollständige, endliche Abläufe und zur Entscheidung passende Vorhersageantworten.
7. Ablehnung beschädigter oder außerhalb der Grenzen liegender gespeicherter Zustände.

TypeScript-Prüfung, Vite-Produktionsbuild und Modelltests sind lokal ausgeführt.

Die Prüfung verwendet Browserfenster. Das Verschieben auf einen physischen zweiten Monitor und das Teilen über eine Konferenz-App hängen vom jeweiligen macOS-/Browser-Setup ab. Sämtliche Pakete, Antworten und Zuordnungen der Experimente sind Modelldaten; die Website führt keinen Linux-eBPF-Datenpfad aus.
