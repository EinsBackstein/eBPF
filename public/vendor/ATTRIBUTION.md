# Original assets and design sources

This is an independent educational eBPF presentation, not a Cilium or Cloudflare product.

Retrieved 2026-10-17. The graphics are original upstream files, without redrawing or content edits; CSS scales them to fit the presentation.

## Cilium website — Cilium Authors

Source repository: https://github.com/cilium/cilium.io
Repository license: Apache-2.0. Full notice: [CILIUM-LICENSE.txt](./CILIUM-LICENSE.txt).

- `cilium/hero-illustration.svg`: https://cilium.io/static/hero-illustration-82419bb3a3f2525e2718d2bc7e094f91.svg
  Source: `src/components/pages/home/hero/images/hero-illustration.svg`.
- `cilium/k8s-bee.png`: `src/images/pages/usecase/k8s-bee.png`.
- `cilium/service-dependency.png`: `src/images/pages/usecase/servicemap-1.png`.

Layout and color references:

- https://cilium.io/ — `src/components/pages/home/hero/hero.jsx`
- https://cilium.io/use-cases/service-map/ — `src/components/pages/use-cases/hero/hero.jsx`
- `tailwind.config.js`: original colors, type scale, grid and spacing.

Changes: German educational text, presentation navigation, fixed 16:9 crop, uniformly enlarged component measurements. Product links are replaced by presentation context. Cilium trademarks remain the property of their owners.

## Cilium technical documentation — Cilium Authors

Source repository: https://github.com/cilium/cilium (Apache-2.0; license as above).

- `cilium/bpf-map.png`: https://docs.cilium.io/en/stable/_images/bpf_map.png
- `cilium/bpf-jit.png`: https://docs.cilium.io/en/stable/_images/bpf_jit.png
  Both from https://docs.cilium.io/en/stable/reference-guides/bpf/architecture/.
- `cilium/hubble-service-map.png`: https://docs.cilium.io/en/stable/_images/hubble_sw_service_map.png
  From https://docs.cilium.io/en/stable/observability/hubble/hubble-ui/.

The bundled Hubble screenshot is an upstream documentation example, not evidence from this lab. The practical section displays captured events from the real running Hubble lab; its native UI is available separately.

## Cloudflare Docs — Cloudflare, Inc.

Source: https://github.com/cloudflare/cloudflare-docs/tree/production
Reference page: https://developers.cloudflare.com/workers/get-started/guide/
License: CC BY 4.0 — [CLOUDFLARE-LICENSE.txt](./CLOUDFLARE-LICENSE.txt).

Used design sources: `src/styles/globals.css`, `src/styles/prose.css`, rendered code title bars and package-manager tabs. Original OKLCH tokens, Inter/JetBrains Mono typography, heading weight/tracking, code surfaces, borders, radii and spacing are reproduced in `src/reference-design.css`. Syntax uses Shiki's GitHub Light theme as on the reference page.

Changes: styles scoped to presentation components; measurements enlarged for projection; custom German content and executable lab controls. The presentation retains its own identity and does not reproduce Cloudflare's logo or imply endorsement.


## eBPF.io production organisations — eBPF.io authors

Retrieved 2026-10-20 from https://ebpf.io/, section “Organizations in every industry use eBPF in production”. Website source: https://github.com/ebpf-io/ebpf.io-website. Content and layout: CC BY 4.0 (same license text bundled as CLOUDFLARE-LICENSE.txt).

`ebpf/google.svg`, `ebpf/netflix.svg`, `ebpf/android.svg`, `ebpf/s-p-global.svg`, `ebpf/meta.svg`, `ebpf/cloudflare.svg`: original inline SVG logos exported without path, color or proportion changes. Organisation trademarks remain the property of their owners; inclusion documents the cited use cases and does not imply endorsement.

Card reference: three columns, white surface, #e6e6e6 border, 8 px corners, 32 px padding, dashed source divider. German summaries, uniform presentation scaling and one source link per card are adaptations. The fuller use-case context is in the speaker notes. Attribution is retained on the sources slide, in this file, and in the handout; title-slide attribution text was removed as requested.

The simple Verifier, JIT and Map teaching diagrams are original HTML/CSS in `src/Fundamentals.tsx`, replacing the more detailed Cilium documentation figures on the slides. The upstream figures remain bundled with their notices.
