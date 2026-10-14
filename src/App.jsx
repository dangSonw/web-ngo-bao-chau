import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import AboutMe from './pages/AboutMe.jsx';
import Inquiry from './pages/Inquiry.jsx';
import Community from './pages/Community.jsx';
import Spirituality from './pages/Spirituality.jsx';
import useReducedMotion from './lib/useReducedMotion.js';

export default function App() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const section = location.pathname.startsWith('/about-me') ? 'about' :
    location.pathname.startsWith('/inquiry') ? 'inquiry' :
    location.pathname.startsWith('/community') ? 'community' :
    location.pathname.startsWith('/spirituality') ? 'spirituality' : 'home';
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={section} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.25 }}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/about-me/:topic?" element={<AboutMe />} />
          <Route path="/inquiry/:topic?" element={<Inquiry />} />
          <Route path="/community/:topic?" element={<Community />} />
          <Route path="/spirituality/:branch?/:topic?" element={<Spirituality />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
