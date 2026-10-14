import { useSyncExternalStore } from 'react';

const preference = window.matchMedia('(prefers-reduced-motion: reduce)');

function subscribe(listener) {
  preference.addEventListener('change', listener);
  return () => preference.removeEventListener('change', listener);
}

export default function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => preference.matches);
}
