# Designanalyse: Cilium und Cloudflare Docs

Untersucht am 17.10.2026 im Browser, jeweils in einer Desktopansicht mit 1440 × 1000 Pixeln. Cilium wurde in dunkler und heller Darstellung betrachtet; Cloudflare Docs in heller Darstellung. Die Messungen stammen aus den berechneten CSS-Stilen der geöffneten Seiten.

## Referenzen und Beobachtungen

### Cilium: Startseite und Service Map

- [Cilium](https://cilium.io/): Zweispaltiger Einstieg mit Text links und einer technischen Schichtenillustration rechts. Die Illustration verbindet Anwendungen, eBPF und Kernel über räumlich versetzte Ebenen, dünne Verbindungen und sparsame Farbakzente. Blau markiert Netzwerktechnik, Gelb die eBPF-Ebene. Grün, Violett und Orange unterscheiden weitere Funktionen.
- Die Startseite verwendet **Inter**. Gemessen am Haupttitel: 48 Pixel, Gewicht 700, Zeilenhöhe 60 Pixel. Der primäre Link nutzt `rgb(0, 115, 230)` und 4 Pixel Eckenradius. Der helle Seitenhintergrund ist kühl und leicht grau; die dunkle Variante ist dunkelblau.
- [Service Map](https://cilium.io/use-cases/service-map/): Themenkennzeichnung oberhalb des Titels, Text und Illustration nebeneinander. Eine konkrete Diagnosefrage führt zur Erklärung. Der Zusammenhang zwischen Kommunikationsweg und Fehlersuche steht im Vordergrund.
- [Cilium / Hubble](https://docs.cilium.io/en/stable/overview/intro/): Kommunikationsbeziehungen, konkrete Flowdetails und die Frage nach dem Grund einer fehlgeschlagenen Verbindung bilden die fachliche Grundlage der Observability-Demo.

### Cloudflare Docs: Übersicht und CLI-Anleitung

- [Übersicht](https://developers.cloudflare.com/): Fast weiße Flächen, dunkle Inter-Typografie, feine graue Grenzen, orange aktive Register und zurückhaltend abgerundete Komponenten. Inhalte werden in überschaubare Themen und konkrete Beispiele aufgeteilt.
- [Workers-CLI-Anleitung](https://developers.cloudflare.com/workers/get-started/guide/): Nummerierte Arbeitsschritte, Voraussetzungen, Codebeispiele mit Dateinamen, Register für Varianten und aufklappbare Erklärungen. Handlungen und ihre erwarteten Ergebnisse werden direkt miteinander verbunden.
- Gemessen: Fließtext **Inter Variable, 16 Pixel, Zeilenhöhe 28 Pixel**. Haupttitel **35 Pixel / 43,75 Pixel, Gewicht 600**. Code verwendet **JetBrains Mono Variable, 14 Pixel / 22,75 Pixel**. Inline-Code besitzt einen sehr hellen Hintergrund, einen dünnen grauen Rahmen, 6 Pixel Eckenradius und orangefarbene Syntaxakzente.
- Die Website-Navigation strukturiert Dokumentation. Für die Präsentation werden die inhaltliche Hierarchie und die Erklärungsmuster in ein festes 16:9-Format übertragen.

## Umsetzung in der Präsentation

| Beobachtetes Gestaltungsmittel     | Übertragung                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Cilium-Schichtenillustration       | Eigene SVG-Grafik zu Userspace, eBPF und Linux-Kernel auf der Titelfolie                    |
| Funktionale Farbcodierung          | Blau für Verbindungen, Grün für Beobachtung/Antworten, Orange für Policy, Gelb für XDP/eBPF |
| Inter + JetBrains Mono             | Lokal gebündelte Schriftarten, passend zu beiden Referenzen                                 |
| Cloudflare-Codefelder und Register | Paket-/Verbindungsdaten, Regel und Ergebnis im synchronisierten Inspector                   |
| Feine Grenzen und helle Flächen    | Leichte technische Diagramme und Tabellen mit klaren Abständen                              |
| Nummerierte Anleitungen            | Fortschreitender Ablauf mit Vorhersage, Prüfung, Entscheidung und Auswertung                |
| Konkrete Diagnosefragen            | Vier unterschiedliche Experimente mit sichtbaren Nachweisen statt austauschbarer Zähler     |

Die Folien behalten ihre feste Größe, die Referentenansicht ihre großen, abschnittsweise dargestellten Notizen. Die Darstellungen sind eigenständig; Markenlogos, Maskottchen, Screenshots und originale Illustrationsdateien der Referenzen werden nicht übernommen.

## Didaktische Überarbeitung der Praxis

1. **Observability:** Eine konkrete Verbindung verfolgen. Service-Ziel, Backend-Zuordnung und HTTP-Antwort werden erst nacheinander sichtbar. Die Frage lautet, was die Service-Adresse allein verrät.
2. **Load Balancing:** Fünf Requests mit Keep-alive und fünf Requests mit neuen TCP-Verbindungen vergleichen. Die Zuordnung von Request zu Verbindung und Backend bleibt im Bild nachvollziehbar. Die Beispielauswahl ist deterministisch, keine behauptete zufällige Messung.
3. **Network Policy:** Client B vor der Regel, mit Regel, Client A als erlaubte Kontrolle und Client B nach Rücknahme. Bei DROP endet der Weg vor dem Dienst. Es entsteht keine erfundene HTTP-403-Antwort.
4. **XDP:** Headerkontext ansehen, Regel-Map lesen, Port vergleichen, Entscheidung ausführen und auswerten. Ein DROP stoppt den gezeichneten Weg; PASS erlaubt weitere Verarbeitung und wird nicht mit einer erfolgreichen HTTP-Antwort gleichgesetzt.

Jeder Fall hat eine Zuschauerfrage und eine optionale Vorhersage A/B. Die vortragende Person kann einzelne Schritte zeigen, zurückgehen, die Wiedergabe starten oder pausieren und verschiedene Fälle vergleichen. Abgeschlossene Policy-/XDP-Fälle bleiben innerhalb des Experiments als Vergleich sichtbar.

Alle IP-Adressen, Requests, Verbindungszuordnungen und Entscheidungen in diesen Experimenten sind Modelldaten. Ein echter Linux-Laboraufbau bleibt eine eigene Aufgabe; die technische Genauigkeit der dargestellten Zusammenhänge wird durch separate Modelltests geprüft.
