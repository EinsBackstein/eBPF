# Präsentation mit Docker Compose

Docker Desktop muss laufen. Der vorhandene k3d-Cluster `ebpf-talk`, der Container `ebpf-talk-xdp` und `.lab/kubeconfig` werden weiterverwendet. Andere Docker-Projekte werden nicht verändert.

## Start und Stopp

Im Repository starten:

```sh
docker compose up --build -d --wait
```

Danach öffnen:

- Präsentation: http://127.0.0.1:5173/
- Hubble UI: http://127.0.0.1:12000/?namespace=ebpf-talk

Die Brücke ist unter `http://127.0.0.1:4174` erreichbar. Alle veröffentlichten Ports sind an `127.0.0.1` gebunden.

Präsentation und Brücke stoppen:

```sh
docker compose down
```

Der bestehende k3d-Cluster und das XDP-Testnetz bleiben dabei erhalten und laufen weiter. Compose entfernt weder den Cluster noch private Dateien oder Messungen. Beim nächsten Start startet die Brücke die beiden bekannten Laborcontainer bei Bedarf und wartet auf Kubernetes und Hubble.

Nach Änderungen am Frontend oder an der Brücke denselben Startbefehl erneut ausführen. Änderungen am eigenen XDP-Programm benötigen weiterhin einen Neubau des separaten Testnetzes mit `npm run lab:xdp:setup`. Änderungen an Sprechtextdateien benötigen keinen Image-Build.

## Private Dateien

Weitere Informationen zum lokalen Editor und Dateiformat stehen unter [Private Sprechtexte](PRIVATE-NOTES.md).

`speaker-notes/` wird nur zur Laufzeit in den Webcontainer eingebunden. Der Editor speichert in diesen lokalen Ordner. `.dockerignore` schließt die Notizen, `.lab/`, `.git/` und lokale Umgebungsdateien vom Build-Kontext aus. Das Image enthält keine Sprechtexte und keine Kubernetes-Zugangsdaten.

Die Brücke erhält ausschließlich `.lab/kubeconfig` als schreibgeschützte Eingabedatei. Sie erstellt eine Kopie im Container und ersetzt dort die Host-Adresse durch den internen Namen des Laborservers. CA und Zertifikatsprüfung bleiben aktiv. Der Host-Kubeconfig wird nicht geändert.

## Container

- `web`: gebautes Frontend, lokaler Sprechtext-Endpunkt und Proxy zur Brücke. Kein Docker-Socket und kein Kubeconfig.
- `lab`: Node-Brücke, kubectl, Docker-CLI, jq und die Linux-Version von Hubble. Verbunden mit dem bestehenden Netzwerk `k3d-ebpf-talk`.

Nur `lab` erhält den Docker-Socket. Dieser Zugriff erlaubt grundsätzlich die Kontrolle des Docker-Daemons und ist für die festen `docker exec`-Befehle im XDP-Testnetz erforderlich. Die Dienste sind für den lokalen Vortrag vorgesehen, nicht für öffentliches Hosting. Der Webcontainer erhält diesen Zugriff nicht.

Die Brücke prüft vor dem Start die Laborlabels der beiden Container. Ein fehlendes Labor muss einmal mit `npm run lab:setup` auf dem Host eingerichtet werden. Compose ersetzt diese Erstinstallation nicht und lädt weder Helm noch k3d auf den Host.

## Diagnose

```sh
docker compose ps
docker compose logs --tail=80 lab web
```

Falls bereits ein lokaler Node-Webserver läuft, ihn vor dem Compose-Start beenden. Die Ports 5173, 4174 und 12000 müssen frei sein.

Falls der Docker-Socket nicht unter `/var/run/docker.sock` liegt:

```sh
DOCKER_SOCKET=/absoluter/pfad/docker.sock docker compose up --build -d --wait
```

Bei fehlendem `.lab/kubeconfig` oder `k3d-ebpf-talk` zuerst die Labor-Erstinstallation ausführen. Die Hostdatei wird absichtlich nicht als leerer Ordner angelegt.

## Geprüft

Der Compose-Start wurde mit dem bestehenden ARM64-Labor getestet. Beide Container erreichten den Zustand `healthy`. Die Prüfungen `npm run lab:xdp:verify` und `npm run lab:verify` liefen gegen die Container erfolgreich durch. Zusätzlich wurden Vite-Proxy, Hubble UI, Lesen und Speichern der privaten Notizen sowie das Fehlen privater Dateien im Webimage geprüft.
