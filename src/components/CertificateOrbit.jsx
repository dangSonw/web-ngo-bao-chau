import { useEffect, useRef, useState } from 'react';
import useReducedMotion from '../lib/useReducedMotion.js';
import { certificatePose, centeredPhase } from '../lib/certificateOrbit.js';
import './CertificateOrbit.css';

export default function CertificateOrbit({ items }) {
  const panel = useRef(null);
  const cards = useRef([]);
  const state = useRef({ phase: 0, original: 0, selected: null, hovered: false, keyboard: false, restoring: false, zoom: 0 });
  const draw = useRef(() => {});
  const [selected, setSelected] = useState(null);
  const reduced = useReducedMotion();

  function select(index, keyboard = false) {
    const s = state.current;
    if ((!keyboard && cards.current[index]?.disabled) || s.selected === index) return;
    if (s.selected === null && !s.restoring) s.original = s.phase;
    s.selected = index;
    s.restoring = false;
    setSelected(index);
    if (reduced) draw.current();
  }

  function restore() {
    const s = state.current;
    s.hovered = false;
    s.keyboard = false;
    s.restoring = s.selected !== null;
    s.selected = null;
    setSelected(null);
    if (reduced) draw.current();
  }

  useEffect(() => {
    let frame;
    let last = performance.now();
    let width = panel.current.clientWidth;
    let height = panel.current.clientHeight;
    const zooms = new Float64Array(items.length);
    const render = (now = performance.now()) => {
      if (!panel.current) return;
      const s = state.current;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const ease = reduced ? 1 : 1 - Math.exp(-dt * 5);
      const zoomEase = reduced ? 1 : 1 - Math.exp(-dt * 3);
      if (s.selected !== null || s.restoring) {
        const target = s.selected === null ? s.original : centeredPhase(s.selected, items.length, s.phase);
        s.phase += (target - s.phase) * ease;
        if (s.restoring && Math.abs(target - s.phase) < 0.002 && s.zoom < 0.01) s.restoring = false;
      } else if (!s.hovered && !s.keyboard && !reduced) {
        s.phase += dt * 0.065;
      }
      panel.current.dataset.phase = s.phase.toFixed(4);
      panel.current.dataset.paused = String(s.hovered || s.keyboard || s.selected !== null || s.restoring || reduced);
      items.forEach((item, index) => {
        const card = cards.current[index];
        if (!card) return;
        const pose = certificatePose(index, items.length, s.phase, width, height);
        const active = index === s.selected;
        const baseHeight = height * 0.38;
        const baseWidth = baseHeight * item.width / item.height;
        zooms[index] += ((active ? 1 : 0) - zooms[index]) * zoomEase;
        const zoom = zooms[index];
        const enlarged = Math.min(width * 0.82 / baseWidth, height * 0.88 / baseHeight);
        const scale = pose.scale + (enlarged - pose.scale) * zoom;
        const x = pose.x * (1 - zoom);
        const y = pose.y * (1 - zoom);
        const front = active || pose.front;
        card.style.width = `${baseWidth * scale}px`;
        card.style.height = `${baseHeight * scale}px`;
        card.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        card.style.zIndex = active ? '200' : String(Math.round((pose.depth + 1) * 50));
        card.style.opacity = String(active ? 1 : 0.5 + (pose.depth + 1) * 0.25);
        card.style.pointerEvents = front ? 'auto' : 'none';
        card.dataset.front = String(front);
        card.disabled = !front;
        card.tabIndex = front ? 0 : -1;
      });
      s.zoom = Math.max(...zooms);
      if (!reduced) frame = requestAnimationFrame(render);
    };
    draw.current = render;
    const observer = new ResizeObserver(() => {
      if (!panel.current) return;
      width = panel.current.clientWidth;
      height = panel.current.clientHeight;
      if (reduced) render();
    });
    observer.observe(panel.current);
    const dismissTouch = event => {
      if (event.pointerType !== 'mouse' && panel.current && !panel.current.contains(event.target)) restore();
    };
    document.addEventListener('pointerdown', dismissTouch);
    const cycle = event => {
      const s = state.current;
      if (event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey || s.selected === null ||
          (!s.hovered && !panel.current.contains(document.activeElement))) return;
      event.preventDefault();
      const next = (s.selected + (event.shiftKey ? -1 : 1) + items.length) % items.length;
      s.keyboard = true;
      select(next, true);
      const card = cards.current[next];
      card.disabled = false;
      card.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', cycle);
    render();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('pointerdown', dismissTouch);
      document.removeEventListener('keydown', cycle);
      draw.current = () => {};
    };
  }, [items, reduced]);

  return <div className="certificate-orbit" ref={panel} role="region" aria-label="Academic awards"
    aria-describedby="certificate-orbit-help"
    onPointerMove={event => {
      if (event.pointerType !== 'mouse') return;
      const card = event.target.closest('[data-certificate-index]');
      if (card && !card.disabled) {
        state.current.hovered = true;
        select(Number(card.dataset.certificateIndex));
      } else if (state.current.selected !== null && state.current.zoom > 0.97 && !state.current.keyboard) {
        restore();
      }
    }}
    onPointerLeave={event => { if (event.pointerType === 'mouse' && !state.current.keyboard) restore(); }}
    onPointerDown={event => { if (event.target === panel.current) restore(); }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && state.current.keyboard) restore(); }}
    onKeyDown={event => {
      if (event.key === 'Escape') {
        restore();
        document.activeElement.blur();
      }
    }}>
    <span className="certificate-orbit__help" id="certificate-orbit-help">
      Hover or focus a front certificate to pause and enlarge it. Tab selects the next image; Shift+Tab selects the previous image. Press Escape to resume and leave the gallery.
    </span>
    {items.map((item, index) => <button key={item.nodeId} type="button"
      className="certificate-orbit__card" data-certificate-index={index}
      ref={element => { cards.current[index] = element; }}
      aria-label={item.alt} aria-pressed={selected === index}
      onPointerDown={event => { if (event.pointerType !== 'mouse') select(index); }}
      onFocus={event => {
        if (event.currentTarget.matches(':focus-visible')) {
          state.current.keyboard = true;
          select(index);
        }
      }}>
      <img src={`/assets/${item.path}`} width={item.width} height={item.height} alt="" draggable="false" />
    </button>)}
  </div>;
}
