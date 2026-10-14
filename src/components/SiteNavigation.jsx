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
    let frame;
    const measure = () => {
      const bottom = section === 'home' ? 0 : element.querySelector('nav').getBoundingClientRect().bottom + window.scrollY;
      const value = `${Math.max(0, bottom)}px`;
      if (document.documentElement.style.getPropertyValue('--menu-height') !== value)
        document.documentElement.style.setProperty('--menu-height', value);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(element.querySelector('nav'));
    window.addEventListener('resize', schedule);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
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
