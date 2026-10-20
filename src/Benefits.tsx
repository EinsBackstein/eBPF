import { Gauge, ShieldCheck, SlidersHorizontal } from "lucide-react";

const benefits = [
  {
    Icon: Gauge,
    title: "Performance",
    points: ["Verarbeitung direkt im Kernel", "JIT übersetzt in CPU-Maschinencode", "Weniger Datentransfers zum Userspace möglich"],
    takeaway: "Aufwand hängt von Programm und Hook ab",
  },
  {
    Icon: ShieldCheck,
    title: "Security",
    points: ["Verifier prüft vor der Ausführung", "Begrenzte Speicherzugriffe und Funktionen", "Laden erfordert in der Regel besondere Rechte"],
    takeaway: "Sandbox mit kontrollierten Möglichkeiten",
  },
  {
    Icon: SlidersHorizontal,
    title: "Flexibilität",
    points: ["Funktionen zur Laufzeit ergänzen", "Ohne Kernel-Patch oder Neustart", "Regeln und Messwerte über Maps austauschen"],
    takeaway: "Programmcode und Konfiguration trennen",
  },
];

export function Benefits() {
  return <div className="benefits-content">
    <div className="benefit-grid">
      {benefits.map(({ Icon, title, points, takeaway }) => <section key={title}>
        <Icon size={56} strokeWidth={1.5} aria-hidden="true" />
        <h2>{title}</h2>
        <ul className="benefit-points">{points.map((point) => <li key={point}>{point}</li>)}</ul>
        <p className="benefit-takeaway">{takeaway}</p>
      </section>)}
    </div>
  </div>;
}
