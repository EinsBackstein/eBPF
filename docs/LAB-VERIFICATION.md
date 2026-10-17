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
