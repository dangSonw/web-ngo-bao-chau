import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import FigmaLabel from './FigmaLabel.jsx';
import { navigation } from '../data/aboutPages.json';
import { navigationLabels as communityLabels } from '../data/communityPages.json';
import { navigationLabels as inquiryLabels } from '../data/inquiryPages.json';
import { navigationLabels as spiritualityLabels } from '../data/spiritualityPages.json';
import './SubpageLayout.css';

export default function SiteNavigation({ pathname }) {
  const header = useRef(null);
  const section = pathname.startsWith('/about-me') ? 'about' :
    pathname.startsWith('/inquiry') ? 'inquiry' :
    pathname.startsWith('/community') ? 'community' :
    pathname.startsWith('/spirituality') ? 'spirituality' : 'home';
  const labels = section === 'community' ? communityLabels : section === 'inquiry' ? inquiryLabels : section === 'spirituality' ? spiritualityLabels : {};
  useLayoutEffect(() => {
    const element = header.current;
    const measure = () => {
      const bottom = section === 'home' ? 0 : element.querySelector('nav').getBoundingClientRect().bottom + window.scrollY;
      document.documentElement.style.setProperty('--menu-height', `${Math.max(0, bottom)}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element.querySelector('nav'));
    window.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [section]);
  return <header ref={header} className="site-navigation" hidden={section === 'home'}>
    <nav className="subpage-layout__navigation" aria-label="Main navigation">
      {navigation.map(item => <Link key={item.key} to={item.route}
        aria-current={item.key === section ? 'page' : undefined}
        aria-disabled={!item.available || undefined}
        onClick={event => { if (!item.available) event.preventDefault(); }}>
        <FigmaLabel label={labels[item.key] || item.label} />
      </Link>)}
    </nav>
  </header>;
}
