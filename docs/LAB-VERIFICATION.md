# Tatsächliche Laborprüfung

Erfolgreicher Lauf: 2026-10-17T19:22:43.430Z. Ausgeführt auf dem eigenen Cluster `ebpf-talk` nach einem sauberen Neuaufbau mit ausschließlich lokal gebundener Kubernetes-API.

Versionen: Docker Engine 29.8.2 / LinuxKit 7.0.14 (ARM64), k3d 5.9.0, k3s 1.35.5-k3s1, Cilium 1.20.3, Hubble CLI 1.20.2, Python-Image 3.13.7-alpine.

Prüfbefehl: `npm run lab:verify` bei laufendem `npm run lab`.

| Prüfung         | Tatsächlich geprüft                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| policy-open     | Policy erfolgreich angewendet (Exit 0)                                                                   |
| request-b       | HTTP 200; tatsächlicher Backend-Name und Request-ID im Backend-Log                                       |
| keepalive       | 5 HTTP-200-Antworten; 1 Client-Socket(s); 1 Backend(s) erreicht                                          |
| new-connections | 10 HTTP-200-Antworten; 10 Client-Socket(s); 2 Backend(s) erreicht                                        |
| policy-trusted  | Policy erfolgreich angewendet (Exit 0)                                                                   |
| request-b       | Exit 1 / TimeoutError; 6 zugehörige POLICY_DENIED-Ereignisse; keine zugehörige Request-ID im Backend-Log |
| request-a       | HTTP 200; tatsächlicher Backend-Name und Request-ID im Backend-Log                                       |
| policy-map      | Tatsächliche BPF-Policy-Map enthält role=trusted                                                         |
| lb-map          | Tatsächliche BPF-Service-Map enthält TCP/8080                                                            |
| policy-open     | Policy erfolgreich angewendet (Exit 0)                                                                   |
| request-b       | HTTP 200; tatsächlicher Backend-Name und Request-ID im Backend-Log                                       |

Zusätzlich geprüft: fremde Origin wird mit HTTP 403 abgelehnt, unbekannter Aktionsname mit HTTP 400. Das Skript setzt die offene Policy im Abschlussblock zurück.

Die Backend-Verteilung ist eine Beobachtung dieses Laufs, keine garantierte Quote. Die Hubble-Erfassung ist auf den Zeitraum des Befehls und bis zu 80 Client-Ereignisse begrenzt. Mehrere Ereignisse können dasselbe Paket beschreiben; Ereignisanzahl und Paketanzahl werden nicht gleichgesetzt.

Die ausführlichen JSON-Protokolle bleiben lokal unter `lab/evidence/` und werden nicht ins öffentliche Repository übertragen.


## Ergänzung: eigener XDP-Filter — 20. Oktober 2026

Cilium/Hubble am 20. Oktober erneut erfolgreich mit `npm run lab:verify` geprüft: alle elf Schritte inklusive Keep-alive, neuen Verbindungen, Policy-Drop, erlaubter Kontrolle, beiden Map-Inspektionen und Wiederherstellung. Zwei unterschiedliche Backend-Pods wurden tatsächlich erreicht.

XDP-Prüfung: `2026-10-20T15:12:56.594Z` mit `npm run lab:xdp:verify`, nach erfolgreichem Docker-Neustart. Eigener Filter im **Generic/SKB-Modus**, veth zwischen zwei eigenen Netzwerk-Namespaces. Debian Bookworm ist im Dockerfile per Manifest-Digest fixiert; Pakete kommen aus dessen offiziellen APT-Repositories. Programm-ID in diesem Prüflauf: `11378`. Programm-ID, Map-IDs und tatsächlich angebundene Programm-ID wurden über alle Regeländerungen verglichen und blieben gleich.

| Aktion | blocked_port[0] | Tatsächliches Ergebnis | ΔPASS | ΔDROP |
| --- | --- | --- | --- | --- |
| clear | 0 | Map gelesen / geändert | +0 | +0 |
| test8080 | 0 | 200 | +6 | +0 |
| test9090 | 0 | 200 | +7 | +0 |
| block | 9090 | Map gelesen / geändert | +0 | +0 |
| test9090 | 9090 | TimeoutError | +0 | +2 |
| test8080 | 9090 | 200 | +6 | +0 |
| clear | 0 | Map gelesen / geändert | +0 | +0 |
| test9090 | 0 | 200 | +6 | +0 |

SYN-Wiederholungen erklären mehrere Drops pro Test. PASS/DROP zählen parsebare, nicht fragmentierte IPv4-TCP-Pakete am Server-Eingang; die Messwerte sind keine HTTP-Request-Anzahl. Der Versuch erfasst keine Cilium-/Hubble-Ereignisse. Der Abschlussblock stellt die offene XDP-Regel auch nach fehlgeschlagenen Assertions wieder her.

Zusätzliche Kernel-Fixtures über `BPF_PROG_TEST_RUN`: TCP/9090 → XDP_DROP; TCP/8080, abgeschnittener IP-Header, abgeschnittener TCP-Header, IPv4-Fragment und ARP → XDP_PASS. Diese künstlichen Pakete sind explizite Parser-/Programmrückgabe-Tests; die obige Tabelle stammt aus echten HTTP-/TCP-Versuchen im veth-Testnetz.

Build und fünf lokale Tests erfolgreich. Die erneute visuelle Browserprüfung war durch die Browser-Sicherheitsrichtlinie blockiert; Details in UI-PRUEFUNG.md. Lokal erfasste JSON-Protokolle und kubeconfig bleiben Git-ignoriert.
