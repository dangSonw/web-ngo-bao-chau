import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, Navigate, useParams } from 'react-router-dom';
import FigmaLabel from '../components/FigmaLabel.jsx';
import SubpageLayout from '../components/SubpageLayout.jsx';
import useReducedMotion from '../lib/useReducedMotion.js';
import { pages, navigationLabels } from '../data/inquiryPages.json';
import './Inquiry.css';

export default function Inquiry() {
  const { topic = 'overview' } = useParams();
  const page = pages.find(item => item.key === topic);
  const reduced = useReducedMotion();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [topic]);
  if (!page) return <Navigate to="/inquiry" replace />;
  return <SubpageLayout page={page} pages={pages} section="inquiry" navigationLabels={navigationLabels} contentId="inquiry-content">
    <AnimatePresence mode="wait" initial={false}>
      <motion.main key={page.key} id="inquiry-content" tabIndex={-1}
        className={`inquiry__frame inquiry__frame--${page.key}`} aria-label={page.title.text}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.25 }}
        style={{ '--title-x': page.titleX, '--title-y': page.titleY, '--body-x': page.bodyX,
          '--body-y': page.bodyY, '--body-width': page.bodyWidth }}>
        <div className="inquiry__heading">
          {page.key !== 'overview' && <img className="inquiry__emblem" src={`/assets/${page.media[0].path}`}
            alt={page.media[0].alt} width={page.media[0].width} height={page.media[0].height}
            style={{ '--media-x': page.media[0].x, '--media-y': page.media[0].y,
              '--media-width': page.media[0].width, '--media-height': page.media[0].height }} />}
          <h1 className="inquiry__title"><FigmaLabel label={page.title} /></h1>
        </div>
        <p className="inquiry__body">{page.body}</p>
        <div className="inquiry__media">
          {page.media.map((item, index) => {
            if (page.key !== 'overview' && index === 0) return null;
            const image = <img src={`/assets/${item.path}`} width={item.width} height={item.height}
              alt={item.route ? '' : item.alt} />;
            return <div key={item.nodeId} className={`inquiry__image inquiry__image--${index}`}
              style={{ '--media-x': item.x, '--media-y': item.y, '--media-width': item.width, '--media-height': item.height }}>
              {item.route ? <Link to={item.route} aria-label={`Open ${item.alt}`}>
                {image}
                <span className="inquiry__planet-caption">{item.alt}</span>
              </Link> : image}
            </div>;
          })}
          {page.links.map(item => <a key={item.url} className="inquiry__research-link" href={item.url}
            target="_blank" rel="noreferrer" style={{ '--link-x': item.x, '--link-y': item.y, '--link-width': item.width }}>
            {item.text}
          </a>)}
        </div>
      </motion.main>
    </AnimatePresence>
  </SubpageLayout>;
}
