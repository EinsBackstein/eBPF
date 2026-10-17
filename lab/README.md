# Ausführbares Cilium-/Hubble-Labor

## Aufbau

Docker Desktop → eigener k3d-Cluster `ebpf-talk` → Cilium 1.20.3 mit Hubble Relay/UI. Kubernetes: k3s v1.35.5-k3s1. Im Namespace `ebpf-talk` laufen zwei Python-3.13.7-Webserver und zwei Clients:

| Objekt       | Bedeutung                           |
| ------------ | ----------------------------------- |
| `web:8080`   | ClusterIP-Service vor zwei Web-Pods |
| `client-a`   | `component=client`, `role=trusted`  |
| `client-b`   | `component=client`, `role=guest`    |
| `web-access` | CiliumNetworkPolicy auf `app=web`   |

Der Aufbau wurde auf einem ARM64-Mac mit Docker Desktop (8 GB VM-RAM, 10 CPUs) getestet. Erstinstallation benötigt Netzwerkzugang für die offiziellen Images, den Helm-Chart und Hubble CLI. Die Hubble-CLI wird projektlokal installiert und per SHA-256 gegen die offizielle Prüfsumme geprüft.

## Starten

Aus dem Repository:

```sh
npm run lab:setup
npm run lab
```

Die Website läuft separat mit `npm run dev`. Die Brücke lauscht auf `127.0.0.1:4174`, Hubble UI auf `127.0.0.1:12000`, Hubble Relay auf `127.0.0.1:4245`, die Kubernetes-API auf `127.0.0.1:6550`.

`lab:setup` verwendet ausschließlich `.lab/kubeconfig`; der aktuelle kubectl-Kontext wird beim Erstellen nicht gewechselt. Alle Laborbefehle verwenden dieselbe Datei. Cluster und Namespace sind fest benannt. Ein bereits vorhandener, anders genutzter Cluster dieses Namens darf nicht für dieses Labor verwendet werden.

Die Brücke akzeptiert nur feste Aktionsnamen. Sie führt Argumentlisten ohne Shell aus, erlaubt keine beliebigen Befehle, bindet an Loopback und prüft Host, Origin und JSON-Content-Type. Sie ist ein lokales Präsentationswerkzeug, kein öffentlicher Mehrbenutzerserver.

## Warum diese Cilium-Einstellungen?

Die Standard-CNI und kube-proxy sind im isolierten k3s-Cluster abgeschaltet. Cilium übernimmt die Netzwerkverarbeitung. Der Pod-CIDR ist entsprechend der offiziellen k3s-Anleitung `10.42.0.0/16`.

In Docker-in-Docker benötigt dieser Aufbau `socketLB.hostNamespaceOnly: true`: Socket-LB läuft nur im Host-Namespace; Serviceverkehr aus Pods wird im TC-Datenpfad umgesetzt. Ohne diese Einstellung waren im Test ClusterIP-Zugriffe und DNS aus Pods nicht erreichbar. Dies ist **kein** Beispiel für reine Socket-LB-Verarbeitung aller Pod-Verbindungen.

Die HTTP-Regeln in beiden Policies aktivieren L7-Verarbeitung über Envoy. Dadurch erscheinen HTTP-Informationen in Hubble. Der Backend-Server sieht als TCP-Gegenstelle die Proxy-Verbindung. Die Server-Gegenstelle darf deshalb nicht mit dem ursprünglichen Client-Socket gleichgesetzt werden.

## Vortragsablauf

### A — Code und Antwort zuordnen

1. `server.py` Zeilen 11–13 zeigen: Podname, Request-ID und Server-Gegenstelle.
2. Client A anfragen. Die Website zeigt den tatsächlichen `kubectl exec`-Befehl und das JSON.
3. Backend-Logs öffnen; dieselbe Request-ID suchen.
4. Hubble UI öffnen. Namespace ist `ebpf-talk`. Die beiden Clients haben unterschiedliche `app`-Labels, damit sie im Servicegraphen unterscheidbar sind.
5. In **Flowdetails** Quelle, Ziel, Zeit und HTTP-/TCP-Kontext lesen.

### B — Keep-alive versus neue Verbindung

1. In `client.py` wird eine `HTTPConnection` nur bei Bedarf erzeugt.
2. Bei `mode != "keepalive"` wird sie im `finally`-Block geschlossen.
3. Fünf Keep-alive-Anfragen ausführen, dann zehn neue Verbindungen.
4. Tatsächliche Backend-Namen vergleichen. Neue Verbindungen ermöglichen eine neue Auswahl; weder Backendwechsel noch 50:50 sind pro Versuch garantiert.

### C — Policy-Ursache zeigen

1. Offene Policy anwenden und Client B erfolgreich testen.
2. `policy-trusted.yaml` zeigen: `endpointSelector` wählt Web-Pods; `fromEndpoints` verlangt zusätzlich `role: trusted`.
3. Eingeschränkte Policy anwenden, Client B testen.
4. Timeout und aktuellen Hubble-Flow `DROPPED / POLICY_DENIED` vergleichen. SYN-Wiederholungen erzeugen weitere Pakete. Zusätzlich können Policy-Verdict und Drop-Meldung dasselbe Paket beschreiben. Ereigniszeilen sind deshalb keine Paketanzahl.
5. Client A als erlaubte Kontrolle testen.
6. Offene Policy wieder anwenden und B nochmals erfolgreich testen.

Es gibt keinen HTTP-403-Status für den blockierten TCP-Aufbau, weil der Webserver den HTTP-Request nicht verarbeitet. Ein Timeout allein genügt nicht als Nachweis; Quelle, Zeitpunkt und Drop-Grund müssen dazu passen.

### D — Kernelzustand lesen

Pods/Service zeigen, dann Endpoint-Liste, `cilium-dbg bpf lb list` und `cilium-dbg bpf policy get --all`. Service-IP mit den beiden Backend-Adressen vergleichen; Labels und Identitäten mit den Policy-Einträgen verbinden. Die Policy-Map zeigt auch den Proxy-Port für die L7-Umleitung.

## Messprotokolle und Grenzen

Jeder Befehl erzeugt `lab/evidence/<UUID>.json` mit Zeitstempeln, Exitcode, stdout/stderr, Ressourcen, Backend-Logs sowie originalem Hubble-JSON. Diese lokalen Protokolle werden nicht ins öffentliche Repository gepusht. Hubble wird auf `ebpf-talk/client*` und den Beginn des jeweiligen Befehls gefiltert. Bis zu 80 Ereignisse werden erfasst; Drops und HTTP-Ereignisse stehen in der Darstellung zuerst. Die Erfassung ist eine begrenzte Momentaufnahme, kein vollständiger Paketmitschnitt. BPF-Map-Lesebefehle erzeugen üblicherweise selbst keine Client-Flows.

Die Hubble UI ist die echte Anwendung, kein Nachbau. Beide Präsentationsfenster zeigen denselben Verkehr, aber Hubble-interne Auswahl und Zoom sind unabhängig. Die integrierte Flow-Auswahl wird dagegen vollständig synchronisiert.

Die Website kann auf macOS keine eBPF-Programme im macOS-Kernel ausführen. Diese Ausführung erfolgt im Linux-Kernel der Docker-VM. Der Vortrag enthält keinen eigenen XDP-Portfilter mehr; er zeigt eine echte Cilium-Netzwerkregel und ihren BPF-Zustand.

## Prüfen und beenden

```sh
npm run lab:verify
```

Der Test setzt die offene Policy auch nach einem fehlgeschlagenen Assertion-Versuch zurück. Anschließend `Ctrl+C` im Brückenterminal beendet die Portweiterleitungen. Nur das eigene Labor stoppen:

```sh
k3d cluster stop ebpf-talk
# Später wieder:
k3d cluster start ebpf-talk
npm run lab
```

Für einen vollständigen Neuaufbau kann der eigens hierfür angelegte Cluster mit `k3d cluster delete ebpf-talk` gelöscht und `lab:setup` erneut ausgeführt werden. Dabei gehen die Ressourcen dieses Laborclusters verloren.

Offizielle Grundlagen: [k3s-Installation](https://docs.cilium.io/en/stable/installation/k3s/), [Hubble UI](https://docs.cilium.io/en/stable/observability/hubble/hubble-ui/), [Policy-Maps](https://docs.cilium.io/en/stable/cmdref/cilium-dbg_bpf_policy_get/), [LB-Maps](https://docs.cilium.io/en/stable/cmdref/cilium-dbg_bpf_lb_list/).
