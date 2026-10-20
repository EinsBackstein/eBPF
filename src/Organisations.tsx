const organisations = [
  {
    name: "Google",
    file: "google",
    task: "Sicherheitsprüfung, Paketverarbeitung und Performance-Messung",
    url: "https://legacy.netdevconf.info/0x14/session.html?talk-replacing-HTB-with-EDT-and-BPF",
    label: "Talk",
  },
  {
    name: "Netflix",
    file: "netflix",
    task: "Einblicke in den Netzwerkverkehr im großen Maßstab",
    url: "https://netflixtechblog.com/how-netflix-uses-ebpf-flow-logs-at-scale-for-network-insight-e3ea997dca96",
    label: "Blog",
  },
  {
    name: "Android",
    file: "android",
    task: "Netzwerknutzung sowie Energie- und Speicher-Profiling",
    url: "https://source.android.com/docs/core/architecture/kernel/bpf",
    label: "Docs",
  },
  {
    name: "S&P Global",
    file: "s-p-global",
    task: "Netzwerk mit Cilium in Cloud und eigenem Rechenzentrum",
    url: "https://www.youtube.com/watch?v=6CZ_SSTqb4g",
    label: "Video",
  },
  {
    name: "Meta",
    file: "meta",
    task: "Paketverarbeitung und Lastverteilung im Rechenzentrum",
    url: "https://engineering.fb.com/2018/05/22/open-source/open-sourcing-katran-a-scalable-network-load-balancer/",
    label: "Blog",
  },
  {
    name: "Cloudflare",
    file: "cloudflare",
    task: "Netzwerksicherheit, Performance und Observability",
    url: "https://blog.cloudflare.com/tag/ebpf/",
    label: "Blog",
  },
];
export function Organisations() {
  return (
    <ul className="organisation-grid" aria-label="Organisationen auf ebpf.io">
      {organisations.map((org) => (
        <li key={org.name}>
          <img src={`./vendor/ebpf/${org.file}.svg`} alt={org.name} />
          <p>{org.task}</p>
          <a href={org.url} target="_blank" rel="noreferrer">
            {org.label} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}
