# Abgleich mit den Originalseiten

Stand: 17. Oktober 2026. Referenzen wurden im Browser visuell geprüft und die Originalquellen gelesen. Die vorherige freie Interpretation sowie die selbst gezeichnete Cilium-ähnliche Illustration wurden ersetzt.

## Cilium

Referenzen: [Startseite](https://cilium.io/) und [Service Map](https://cilium.io/use-cases/service-map/). Maßgebliche Quellen im Repository [cilium/cilium.io](https://github.com/cilium/cilium.io): `tailwind.config.js`, `src/components/pages/home/hero/hero.jsx`, `src/components/pages/use-cases/hero/hero.jsx`.

Übernommene Originalwerte:

| Bestandteil      | Original                                                                      |
| ---------------- | ----------------------------------------------------------------------------- |
| Schrift          | Inter                                                                         |
| Text             | `#141A1F`                                                                     |
| Hero-Fläche      | `#F6F7F8`                                                                     |
| Primärblau       | `#0073E6`                                                                     |
| Rahmen           | `#E0E5EB`, `#D1D7E0`                                                          |
| Hero-Überschrift | 48 px / 60 px, Gewicht 700                                                    |
| Hero-Text        | 18 px, maximal 488 px breit                                                   |
| Aufbau           | 12-Spalten-Grid; Text links, Originalillustration rechts                      |
| CTAs             | 4 px Radius, Blau bzw. weiß mit Rahmen                                        |
| Use-Case-Badge   | 14 px, 600, uppercase, 1.4 px Laufweite; Blau mit 10 % Hintergrund            |
| Use-Case-Aufbau  | Badge, Überschrift, Tagline, feine Trennlinie, Frage + Erklärung; Bild rechts |

Die beiden Cilium-Folien vergrößern diese Komponentenmaße um 1.25. Text und Navigationskontext sind auf das Referat angepasst. Die umgebende Website-Navigation, Konferenzankündigung und Produktwerbung werden nicht als Bedienelemente des Vortrags kopiert. Es handelt sich um eine Übertragung der Originalkomponenten auf ein festes 16:9-Format, nicht um eine Behauptung pixelidentischer vollständiger Webseiten.

Originalgrafiken:

- Hero-SVG direkt von cilium.io, ohne Nachzeichnung.
- Kubernetes Bee direkt aus dem Service-Map-Seitenquellcode.
- BPF-Map- und JIT-Abbildungen aus [BPF Architecture](https://docs.cilium.io/en/stable/reference-guides/bpf/architecture/).

## Cloudflare Docs

Referenz: [Workers / Get started / CLI](https://developers.cloudflare.com/workers/get-started/guide/). Originalquellen: [globals.css](https://github.com/cloudflare/cloudflare-docs/blob/production/src/styles/globals.css), [prose.css](https://github.com/cloudflare/cloudflare-docs/blob/production/src/styles/prose.css).

Übernommene Originalwerte:

| Bestandteil                    | Original                                                |
| ------------------------------ | ------------------------------------------------------- |
| Hintergrund                    | `oklch(0.99 0 0)`                                       |
| Text                           | `oklch(0.21 0 0)`                                       |
| Codekarte                      | `oklch(1 0 0)`                                          |
| Code-Titel / abgesenkte Fläche | `oklch(0.975 0 0)`                                      |
| Rahmen                         | `oklch(0.92 0 0)`                                       |
| Sekundärtext                   | `oklch(0.556 0 0)`                                      |
| Orange                         | `oklch(0.687 0.208 38.8)`                               |
| Aktive neutrale Tabs           | `oklch(0.92 0 0)`, 6 px Radius                          |
| h1                             | Inter Variable, 35 px / 43.75 px, 600, −0.025 em        |
| h2                             | 20.8 px / 36.4 px, 600, −0.015 em                       |
| Fließtext                      | 16 px / 28 px                                           |
| Code                           | JetBrains Mono Variable, 14 px / 22.75 px, GitHub Light |
| Code-Titelleiste               | 13 px / 20 px, 500, 8 px / 12 px Innenabstand           |
| Codekarte                      | 8 px Radius, feiner Rahmen, Kopieraktion                |

Die neutralen Tabs der aktuell ausgelieferten Referenz ersetzen die zuvor erfundene orange Unterstreichung. Die Originalfarben werden als OKLCH-Werte im CSS verwendet. Die technischen Folien übernehmen Breadcrumb, Seitentitel, Metazeile, Inhaltsrhythmus, Tabellen und Codekarten. Typografie ist für die Projektion vergrößert. Ein Bildschirm voller Produktnavigation wurde zugunsten der bereits geforderten Präsentationsbedienung nicht wieder eingeführt.

Der Code wird mit Shiki im selben GitHub-Light-Thema aus den tatsächlich ausgeführten Dateien generiert. Die Pagination hält Quellzeilennummern bei und ermöglicht eine vergrößerte Codeansicht.

## Tatsächliche Daten statt Grafikmodell

Hubble wird nicht nachgebaut. Die Folie bettet die echte, lokal portweitergeleitete Hubble UI ein. Die integrierten Ansichten zeigen stdout, Backend-Logs und Original-Flow-JSON aus demselben Linux-Labor. Zeitstempel, Request-IDs, Verdict und Drop-Grund ermöglichen die Erklärung der Ursache. Der frühere Paketpfad mit animierten Punkten und die Vorhersagequizze des Praxisteils sind entfernt.

Lizenztexte, Asset-URLs und Modifikationen: [ATTRIBUTION.md](../public/vendor/ATTRIBUTION.md).
