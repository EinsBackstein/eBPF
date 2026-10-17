export function KernelIllustration() {
  return (
    <svg
      className="kernel-illustration"
      viewBox="0 0 700 620"
      role="img"
      aria-label="Schichtenmodell: Userspace konfiguriert eBPF; eBPF-Programme arbeiten an Hooks im Linux-Kernel"
    >
      <defs>
        <pattern
          id="iso-grid"
          width="60"
          height="34"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(30)"
        >
          <path d="M0 0H60V34" fill="none" stroke="#dce5ec" strokeWidth="1" />
        </pattern>
      </defs>
      <ellipse cx="350" cy="365" rx="310" ry="175" fill="url(#iso-grid)" />
      <g className="iso-shadow">
        <path d="m88 410 252-142 270 142-252 148Z" fill="#e6ecf2" />
      </g>
      <g>
        <path
          d="m98 377 252-142 252 142-252 142Z"
          fill="#eaf2ff"
          stroke="#84a8db"
          strokeWidth="3"
        />
        <path
          d="M98 377v17l252 142v-17m0 17 252-142v-17"
          fill="#d7e5f7"
          stroke="#84a8db"
          strokeWidth="2"
        />
        <text
          x="350"
          y="398"
          textAnchor="middle"
          fill="#2d65ae"
          fontSize="28"
          fontWeight="600"
        >
          Linux-Kernel
        </text>
        <text x="350" y="430" textAnchor="middle" fill="#6081a5" fontSize="20">
          Socket · TC · XDP · Tracing
        </text>
      </g>
      <path
        d="M350 216v86"
        stroke="#a8b8c5"
        strokeWidth="2"
        strokeDasharray="6 8"
      />
      <g>
        <path
          d="m134 255 216-122 216 122-216 122Z"
          fill="#fff7d4"
          stroke="#e2bc44"
          strokeWidth="3"
        />
        <path
          d="M134 255v15l216 122v-15m0 15 216-122v-15"
          fill="#f9e8a7"
          stroke="#e2bc44"
          strokeWidth="2"
        />
        <text
          x="350"
          y="266"
          textAnchor="middle"
          fill="#a37a17"
          fontSize="46"
          fontWeight="650"
        >
          eBPF
        </text>
        <text x="350" y="299" textAnchor="middle" fill="#b38d38" fontSize="20">
          Programme + Maps
        </text>
      </g>
      <g>
        <path
          d="m180 137 170-96 170 96-170 96Z"
          fill="white"
          stroke="#a6bbd1"
          strokeWidth="2"
        />
        <text
          x="350"
          y="139"
          textAnchor="middle"
          fill="#354a63"
          fontSize="27"
          fontWeight="600"
        >
          Userspace
        </text>
        <text x="350" y="166" textAnchor="middle" fill="#72869b" fontSize="18">
          Python · Regeln · Messwerte
        </text>
      </g>
      <g fill="#fff" strokeWidth="3">
        <circle cx="100" cy="377" r="11" stroke="#e1875c" />
        <circle cx="602" cy="377" r="11" stroke="#6ca38d" />
        <circle cx="350" cy="520" r="11" stroke="#8d78ba" />
      </g>
      <g fontSize="21" fill="#607082">
        <text x="30" y="433">
          Pakete
        </text>
        <text x="574" y="433">
          Flows
        </text>
        <text x="307" y="572">
          Ereignisse
        </text>
      </g>
    </svg>
  );
}
