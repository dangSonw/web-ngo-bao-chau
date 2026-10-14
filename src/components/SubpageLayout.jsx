import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pages as aboutPages } from '../data/aboutPages.json';
import './SubpageLayout.css';

export default function SubpageLayout({ page, children, pages = aboutPages, section = 'about', contentId = 'about-content', showPagination = true, paginationLabel, spacePages = pages }) {
  const navigate = useNavigate();
  const destinations = pages.map(item => ({ route: item.route, name: item.name || item.title.text }));
  useEffect(() => {
    const advance = event => {
      if (event.code !== 'Space' || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey ||
          event.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="dialog"]')) return;
      const index = spacePages.findIndex(item => item.route === window.location.pathname);
      if (index < 0) return;
      event.preventDefault();
      if (event.repeat) return;
      navigate(spacePages[(index + 1) % spacePages.length].route);
    };
    document.addEventListener('keydown', advance);
    return () => document.removeEventListener('keydown', advance);
  }, [spacePages, navigate]);
  return <div className={`subpage-layout subpage-layout--${section}`}
    style={{ '--pagination-bottom': page.paginationBottom ?? 17 }}>
      <img className="subpage-layout__background"
        src={`/assets/${page.background}`} width="2880" height="1488" alt=""
      />
    <div className="subpage-layout__canvas">
      <a className="subpage-layout__skip" href={`#${contentId}`}>Skip to content</a>
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
