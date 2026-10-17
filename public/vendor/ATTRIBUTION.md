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

The bundled Hubble screenshot is an upstream documentation example, not evidence from this lab. The practical section embeds the actual running Hubble UI instead.

## Cloudflare Docs — Cloudflare, Inc.

Source: https://github.com/cloudflare/cloudflare-docs/tree/production
Reference page: https://developers.cloudflare.com/workers/get-started/guide/
License: CC BY 4.0 — [CLOUDFLARE-LICENSE.txt](./CLOUDFLARE-LICENSE.txt).

Used design sources: `src/styles/globals.css`, `src/styles/prose.css`, rendered code title bars and package-manager tabs. Original OKLCH tokens, Inter/JetBrains Mono typography, heading weight/tracking, code surfaces, borders, radii and spacing are reproduced in `src/reference-design.css`. Syntax uses Shiki's GitHub Light theme as on the reference page.

Changes: styles scoped to presentation components; measurements enlarged for projection; custom German content and executable lab controls. The presentation retains its own identity and does not reproduce Cloudflare's logo or imply endorsement.
