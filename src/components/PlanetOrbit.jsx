import { useEffect, useRef } from 'react';
import useReducedMotion from '../lib/useReducedMotion.js';
import './PlanetOrbit.css';

// The source constellation revolves around (1000, 395). An ellipse keeps
// its full orbit inside the scene without covering the text or navigation.
export default function PlanetOrbit({ items }) {
  const scene = useRef(null);
  const planets = useRef([]);
  const reduced = useReducedMotion();
  useEffect(() => {
    let frame, last = performance.now(), phase = 0;
    let width = scene.current.clientWidth, height = scene.current.clientHeight;
    const render = (now = performance.now()) => {
      if (!scene.current) return;
      if (!reduced) phase += Math.min((now - last) / 1000, 0.05) * Math.PI * 2 / 180;
      last = now;
      const cos = Math.cos(phase), sin = Math.sin(phase);
      scene.current.dataset.phase = phase.toFixed(5);
      items.forEach((item, index) => {
        const x = item.x + item.width / 2 - 1000;
        const y = (item.y + item.height / 2 - 395) / 0.75;
        const planet = planets.current[index];
        // Move the composited image rather than laying it out and repainting
        // its edges at tiny left/top increments on every frame.
        const px = (350 + x * cos - y * sin) * width / 700;
        const py = (295 + (x * sin + y * cos) * 0.75) * height / 580;
        planet.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%)`;
      });
      if (!reduced) frame = requestAnimationFrame(render);
    };
    const observer = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      if (reduced) render();
    });
    observer.observe(scene.current);
    render();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [items, reduced]);
  return <div className="planet-orbit" ref={scene} role="group" aria-label="Five planets orbiting a shared center">
    {items.map((item, index) => <img key={item.nodeId} ref={element => { planets.current[index] = element; }}
      src={`/assets/${item.path}`} alt={item.alt} width={item.width} height={item.height}
      style={{ width: `${item.width / 7}%`, height: `${item.height / 5.8}%` }} />)}
  </div>;
}
