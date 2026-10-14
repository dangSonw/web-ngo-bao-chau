import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, Navigate, useParams } from 'react-router-dom';
import FigmaLabel from '../components/FigmaLabel.jsx';
import SubpageLayout from '../components/SubpageLayout.jsx';
import CertificateOrbit from '../components/CertificateOrbit.jsx';
import PlanetOrbit from '../components/PlanetOrbit.jsx';
import useReducedMotion from '../lib/useReducedMotion.js';
import { choices, pages } from '../data/aboutPages.json';
import './AboutMe.css';

export default function AboutMe() {
  const { topic = 'overview' } = useParams();
  const page = pages.find(item => item.key === topic);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    for (const item of pages) {
      const image = new Image();
      image.src = `/assets/${item.background}`;
    }
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [topic]);
  if (!page) return <Navigate to="/about-me" replace />;
  return <SubpageLayout page={page}>
    <AnimatePresence mode="wait" initial={false}>
      <motion.main key={page.key} id="about-content" tabIndex={-1}
        className={`about__frame about__frame--${page.key}`}
        aria-label={page.title.text}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.25 }}
        style={{ '--title-x': page.titleX, '--title-y': page.titleY, '--body-x': page.bodyX,
          '--body-y': page.bodyY, '--body-width': page.bodyWidth, '--subtitle-y': page.subtitleY }}>
        <h1 className="about__title"><FigmaLabel label={page.title} /></h1>
        {page.subtitle && <h2 className="about__subtitle">{page.subtitle}</h2>}
        <p className="about__body">{page.body}</p>
        {page.key === 'overview' && <div className="about__choices">
          {choices.map(choice => <Link key={choice.key} to={choice.route} className="about__choice"
            style={{ '--choice-x': choice.x, '--choice-y': choice.y, '--choice-title-x': choice.titleX,
              '--caption-y': choice.captionY, '--caption-right': choice.captionRight, '--line-y': choice.lineY }}>
            <FigmaLabel label={choice.title} />
            <span className="about__choice-caption">{choice.caption}</span>
            <img className="about__choice-line" src={`/assets/${choice.linePath}`} width="421" height="12" alt="" />
          </Link>)}
        </div>}
        {page.key === 'logician' && <CertificateOrbit items={page.media} />}
        {page.key === 'seeker' && <PlanetOrbit items={page.media} />}
      </motion.main>
    </AnimatePresence>
  </SubpageLayout>;
}
