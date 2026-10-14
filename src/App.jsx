import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import AboutMe from './pages/AboutMe.jsx';
import Inquiry from './pages/Inquiry.jsx';
import Community from './pages/Community.jsx';
import Spirituality from './pages/Spirituality.jsx';
import SiteNavigation from './components/SiteNavigation.jsx';
import useReducedMotion from './lib/useReducedMotion.js';

export default function App() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [shownLocation, setShownLocation] = useState(location);
  const shown = useRef(location);
  const shade = useAnimationControls();
  useEffect(() => {
    if (reduceMotion) {
      shown.current = location;
      setShownLocation(location);
      shade.set({ opacity: 0 });
      return;
    }
    if (shown.current.key === location.key) return;
    let cancelled = false;
    const changePage = async () => {
      await shade.start({ opacity: 1, transition: { duration: 0.22, ease: 'easeInOut' } });
      if (cancelled) return;
      shown.current = location;
      setShownLocation(location);
      // Commit the destination while covered, then wait for its local images.
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await Promise.allSettled([document.fonts.ready, ...[...document.images].map(img => img.decode())]);
      if (cancelled) return;
      await shade.start({ opacity: 0, transition: { duration: 0.28, ease: 'easeInOut' } });
    };
    changePage();
    return () => { cancelled = true; };
  }, [location, reduceMotion, shade]);
  return (
    <>
      <SiteNavigation pathname={shownLocation.pathname} />
        <Routes location={shownLocation}>
          <Route path="/" element={<Home />} />
          <Route path="/about-me/:topic?" element={<AboutMe />} />
          <Route path="/inquiry/:topic?" element={<Inquiry />} />
          <Route path="/community/:topic?" element={<Community />} />
          <Route path="/spirituality/:branch?/:topic?" element={<Spirituality />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      <motion.div className="page-shade" aria-hidden="true" initial={{ opacity: 0 }} animate={shade} />
    </>
  );
}
