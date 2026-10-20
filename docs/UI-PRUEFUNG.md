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

## Browserkommentare umgesetzt — 20. Oktober 2026

- Fünf Grundlagenfolien im gemeinsamen Layout: Definition, Hooks, Verifier, JIT, Maps. Die aktuelle Position ist rechts durch `aria-current=step` und den orangefarbenen Balken markiert. Verifier, JIT und Maps verwenden einfache HTML-/CSS-Abläufe statt der umfangreichen Dokumentationsgrafiken.
- Die Definition wurde in der Referentenansicht bei 1135 × 853 geprüft: kein Dokument- oder Folienkörperüberlauf. Die Seitenmarkierung war in beiden Fenstern korrekt. Verifier, JIT und Maps hatten in der Zuschaueransicht jeweils 0 px Folienkörperüberlauf. Die Hook-Folie hatte zunächst 3 px Überlauf; die vertikalen Zeilenabstände wurden anschließend reduziert.
- Die sechs Original-Logos der ebpf.io-Produktionsübersicht laden vollständig. Das Kartenraster hatte 0 px Überlauf, ebenso jede einzelne Karte. Fachlicher Kontext steht in den Referentennotizen.
- Die vollständige Python-/YAML-Datei ist scrollbar. Gemessener Codebereich: 348 px sichtbar, 1149 px Gesamthöhe. Nach einem Scrollbutton: Referenten- und Zuschauerfenster jeweils 160 px Scrollposition bei 801 px Scrollbereich.
- Tastaturtest nach einem sauberen Neuladen: fokussierter Codebereich, Bild ab → Codeende; die Folie blieb unverändert. Zuschauerposition 285 px, Referentenposition 285,5 px (subpixelbedingte Rundung). Die große Codeansicht hatte keinen Dokument-/Folienkörperüberlauf.
- Die Laboransicht enthält Code + Ergebnis, Code groß, Originalausgabe, Flowdetails und Backend-Logs. Hubble UI ist aus der Auswahl entfernt; alte gespeicherte Auswahl wird auf Flowdetails umgestellt.
- Ein zusätzlicher statischer React-Render aller 16 Folien prüfte die entfernten Metazeilen, Titel-Links, Grafik-Fußzeile und Hubble-Agenda; genau fünf aktuelle Themenmarkierungen und sechs Logos; scrollbar markierte Codebereiche auf allen fünf Praxisfolien; Richtzeiten weiterhin insgesamt 25 Minuten. Build und sechs lokale Tests erfolgreich.

Belegbilder lokal unter `.lab/screenshots/`: `foundation-0.jpg` (Hooks vor Abstandskorrektur), `foundation-2.jpg` (JIT), `foundation-3.jpg` (Maps), `organisations.jpg`, `code-scroll-presenter.jpg`. Diese Dateien bleiben Git-ignoriert.

Der weitere vollständige Browserdurchlauf wurde durch einen Abbruch der Browserverbindung unterbrochen. Deshalb wird hier keine erneute vollständige Sichtprüfung aller 16 Folien und aller Code-Dateien behauptet. Die oben beschriebenen Einzelprüfungen wurden vorher erfolgreich durchgeführt.
