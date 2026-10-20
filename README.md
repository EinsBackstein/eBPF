<p align="center">
  <img src="public/vendor/cilium/hero-illustration.svg" alt="Anwendungen, eBPF und Linux-Kernel im Schichtenmodell" width="460" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/eBPF-Linux-FCC624?style=flat-square&logo=linux&logoColor=black" alt="eBPF auf Linux" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker Compose" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
</p>

# eBPF

Ein lokales Linux-Labor für Paketfilter, Lastverteilung und Netzwerkregeln. Mit eigenem XDP-Programm, Cilium und Hubble. Die Weboberfläche führt die Versuche aus und zeigt Messwerte, Netzwerkereignisse und Server-Logs.

## Starten

Docker Desktop und ein [eingerichtetes Labor](lab/README.md) vorausgesetzt:

```sh
docker compose up --build -d --wait
```

Öffnen: [localhost:5173](http://127.0.0.1:5173/)

Stoppen:

```sh
docker compose down
```

## Dokumentation

[Docker-Setup](docs/DOCKER.md) · [Linux-Labor](lab/README.md) · [Quellen und Lizenzen](public/vendor/ATTRIBUTION.md)
