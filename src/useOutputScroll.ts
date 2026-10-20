import { useLayoutEffect, useRef, type RefObject } from "react";

export type OutputScroll = Record<string, { x: number; y: number }>;

export function useOutputScroll(
  root: RefObject<HTMLDivElement | null>,
  positions: OutputScroll,
  contentKey: string,
  onChange?: (positions: OutputScroll) => void,
) {
  const latest = useRef({ positions, onChange });
  latest.current = { positions, onChange };
  useLayoutEffect(() => {
    const host = root.current;
    if (!host) return;
    let live = true;
    const applied = new Map<HTMLElement, { left: number; top: number }>();
    const boxes = Array.from(host.querySelectorAll<HTMLElement>("[data-sync-scroll]"));
    const apply = () => {
      if (!live) return;
      for (const box of boxes) {
        const position = latest.current.positions[box.dataset.syncScroll!] || { x: 0, y: 0 };
        const left = position.x * Math.max(0, box.scrollWidth - box.clientWidth);
        const top = position.y * Math.max(0, box.scrollHeight - box.clientHeight);
        if (Math.abs(box.scrollLeft - left) > 1) box.scrollLeft = left;
        if (Math.abs(box.scrollTop - top) > 1) box.scrollTop = top;
        applied.set(box, { left: box.scrollLeft, top: box.scrollTop });
      }
    };
    const scroll = (event: Event) => {
      const box = event.target;
      if (!(box instanceof HTMLElement) || !box.dataset.syncScroll) return;
      const previous = applied.get(box);
      if (previous && Math.abs(previous.left - box.scrollLeft) <= 1 &&
          Math.abs(previous.top - box.scrollTop) <= 1) return;
      const width = box.scrollWidth - box.clientWidth;
      const height = box.scrollHeight - box.clientHeight;
      const position = {
        x: width > 0 ? Math.max(0, Math.min(1, box.scrollLeft / width)) : 0,
        y: height > 0 ? Math.max(0, Math.min(1, box.scrollTop / height)) : 0,
      };
      applied.set(box, { left: box.scrollLeft, top: box.scrollTop });
      const next = { ...latest.current.positions, [box.dataset.syncScroll]: position };
      latest.current.positions = next;
      latest.current.onChange?.(next);
    };
    apply();
    host.addEventListener("scroll", scroll, true);
    const observer = new ResizeObserver(apply);
    for (const box of boxes) {
      observer.observe(box);
      for (const child of box.children) observer.observe(child);
    }
    document.fonts.ready.then(apply);
    return () => { live = false; observer.disconnect(); host.removeEventListener("scroll", scroll, true); };
  }, [root, positions, contentKey]);
}
