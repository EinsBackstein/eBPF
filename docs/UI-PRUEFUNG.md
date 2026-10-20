# Browserprüfung — 17. Oktober 2026

Geprüft über den echten lokalen Browser unter `http://127.0.0.1:5173/`, mit einer separaten Zuschaueransicht. Keine Browser-Simulation als Testersatz.

- Alle 15 Folien durch die Präsentationsnavigation geprüft. Ein Überlauf der Ergebnistabelle wurde behoben; danach kein Überlauf des Folienkörpers.
- Originalgrafiken auf Titel-, Grundlagen-, JIT-, Map- und Laborfolie vollständig geladen.
- Jede Seite aller fünf Quelldateien in der geteilten Codeansicht geprüft: kein vertikaler Überlauf des Codefensters. Quellzeilennummern bleiben erhalten.
- Wiederholungsfolie mit allen drei eingeblendeten Antworten geprüft: kein Überlauf.
- Referentenansicht bei **1135 × 853** mit **30 px** Sprechtext geprüft: Dokumentüberlauf 0 px; sichtbarer Notiztext 127 px kürzer als der verfügbare Bereich. Laborsteuerung endet bei y=725; Fußleiste beginnt bei y=793. Keine Notiz oder Laborsteuerung erfordert Seitenscrollen.
- Folienwechsel und Auswahl der Laboransicht im Zuschauerfenster beobachtet. Dort keine Referentennotizen.
- Echte Hubble UI mit Namespace `ebpf-talk` im Publikum eingebettet: Clients `client-a`/`client-b`, Servicegruppe `web`, Port 8080 und Flowtabelle sichtbar. Der aktuelle Hubble-Release verwendet `/?namespace=ebpf-talk`; der alte Dokumentationspfad `/ebpf-talk` führte zu 404 und wurde ersetzt.
- Über die Website die Policy eingeschränkt und Client B erneut angefragt. Tatsächlicher Exitcode 1 / TimeoutError; integrierte Hubble-Ansicht zeigte aktuelle `DROPPED / POLICY_DENIED`-Ereignisse mit Quelle `client-b`, Label `role=guest`, Ziel-Web-Pod und TCP/8080.
- Die native Hubble UI bleibt während einer Aktion geöffnet, damit neue Flows live erscheinen. Zoom/Filter der nativen Hubble UI sind unabhängig zwischen den Fenstern; die integrierte Flow-Auswahl ist synchronisiert.

Lokale Belegbilder liegen unter `.lab/screenshots/` (Git-ignoriert): `hubble-live.jpg`, `policy-code-result.jpg`, `policy-flow-proof.jpg`, `macbook-notes.jpg`.

Build, Modell-/Parserprüfungen und tatsächliche Laborprüfungen werden getrennt dokumentiert. Das ausführbare Live-Testskript und dessen letzte verifizierte Ergebnisse stehen in [LAB-VERIFICATION.md](LAB-VERIFICATION.md).


## Ergänzung — 20. Oktober 2026

Die neue XDP-Folie (jetzt 16 Folien) und ihre drei zusätzlichen Python-Dateien sind gebaut; Quelltextgleichheit und Erhalt der Map-Messwerte in der serialisierten Zuschaueransicht sind automatisiert geprüft. Eine erneute visuelle Browserprüfung war in dieser Sitzung durch die Browser-URL-Sicherheitsrichtlinie blockiert. Die obigen Überlauf- und Screenshot-Befunde gelten für den Stand vom 17. Oktober, nicht als Beleg für die neue Folie. Die echte XDP-Ausführung ist separat in LAB-VERIFICATION.md dokumentiert.
