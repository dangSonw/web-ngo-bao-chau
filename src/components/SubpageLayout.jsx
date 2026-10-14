import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import FigmaLabel from './FigmaLabel.jsx';
import useReducedMotion from '../lib/useReducedMotion.js';
import { navigation, pages as aboutPages } from '../data/aboutPages.json';
import './SubpageLayout.css';

export default function SubpageLayout({ page, children, pages = aboutPages, section = 'about', navigationLabels = {}, contentId = 'about-content', showPagination = true, paginationLabel }) {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const destinations = pages.map(item => ({ route: item.route, name: item.name || item.title.text }));
  useEffect(() => {
    const advance = event => {
      if (event.code !== 'Space' || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey ||
          event.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="dialog"]')) return;
      const index = pages.findIndex(item => item.route === window.location.pathname);
      if (index < 0) return;
      event.preventDefault();
      if (event.repeat) return;
      navigate(pages[(index + 1) % pages.length].route);
    };
    document.addEventListener('keydown', advance);
    return () => document.removeEventListener('keydown', advance);
  }, [pages, navigate]);
  return <div className={`subpage-layout subpage-layout--${section}`}
    style={{ '--pagination-bottom': page.paginationBottom ?? 17 }}>
    <AnimatePresence initial={false}>
      <motion.img key={page.background} className="subpage-layout__background"
        src={`/assets/${page.background}`} width="2880" height="1488" alt=""
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }} />
    </AnimatePresence>
    <div className="subpage-layout__canvas">
      <a className="subpage-layout__skip" href={`#${contentId}`}>Skip to content</a>
      <nav className="subpage-layout__navigation" aria-label="Main navigation">
        {navigation.map(item => <Link key={item.key} to={item.route}
          aria-current={item.key === section ? 'page' : undefined}
          aria-disabled={!item.available || undefined}
          onClick={event => { if (!item.available) event.preventDefault(); }}>
          <FigmaLabel label={navigationLabels[item.key] || item.label} />
        </Link>)}
      </nav>
      {children}
      <span className="figma-label__text" aria-live="polite">{page.name || page.title.text}</span>
      {showPagination && <nav className="subpage-layout__pagination" aria-label={paginationLabel || (section === 'about' ? 'About Me screens' : section === 'community' ? 'Community screens' : 'Inquiry screens')}
        aria-keyshortcuts="Space ArrowLeft ArrowRight Home End"
        onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          const focusedRoute = event.target.closest('a')?.getAttribute('href');
          const index = destinations.findIndex(item => item.route === (focusedRoute || page.route));
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? destinations.length - 1 :
            (index + (event.key === 'ArrowRight' ? 1 : -1) + destinations.length) % destinations.length;
          event.preventDefault();
          navigate(destinations[next].route);
          event.currentTarget.querySelectorAll('a')[next]?.focus();
        }}>
        {destinations.map(item => <Link key={item.route} to={item.route}
          aria-label={item.name} aria-current={page.route === item.route ? 'page' : undefined}>
          <span aria-hidden="true" />
        </Link>)}
      </nav>}
    </div>
  </div>;
}
