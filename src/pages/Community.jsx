import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, Navigate, useParams } from 'react-router-dom';
import FigmaLabel from '../components/FigmaLabel.jsx';
import SubpageLayout from '../components/SubpageLayout.jsx';
import { pages } from '../data/communityPages.json';
import './Community.css';

function mediaStyle(item) {
  return { '--media-x': item.x, '--media-y': item.y, '--media-width': item.width, '--media-height': item.height,
    '--relative-x': item.relativeX, '--relative-y': item.relativeY,
    '--relative-width': item.relativeWidth, '--relative-height': item.relativeHeight };
}

export default function Community() {
  const { topic = 'overview' } = useParams();
  const page = pages.find(item => item.key === topic);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [topic]);
  if (!page) return <Navigate to="/community" replace />;
  return <SubpageLayout page={page} pages={pages} section="community" contentId="community-content">
    <AnimatePresence mode="wait" initial={false}>
      <motion.main key={page.key} id="community-content" tabIndex={-1}
        className={`community__frame community__frame--${page.key}`} aria-label={page.title.text}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0 }}
        style={{ '--title-x': page.titleX, '--title-y': page.titleY, '--body-x': page.bodyX,
          '--body-y': page.bodyY, '--body-width': page.bodyWidth }}>
        <div className="community__heading">
          {page.emblems.length > 0 && <div className="community__emblem">
            {page.emblems.map(item => <img key={item.nodeId} src={`/assets/${item.path}`}
              width={item.width} height={item.height} alt={item.alt} style={mediaStyle(item)} />)}
          </div>}
          <h1 className="community__title"><FigmaLabel label={page.title} /></h1>
        </div>
        <div className="community__copy">
          <p className="community__body">{page.body}</p>
          {page.sources.length > 0 && <div className="community__sources" aria-label="Project sources">
            {page.sources.map(item => <a key={item.url} href={item.url} target="_blank" rel="noreferrer">
              {item.prefix}{item.url}
            </a>)}
          </div>}
        </div>
        {page.key === 'overview' ? <div className="community__chapters">
          {page.chapters.map(chapter => <Link key={chapter.key} to={chapter.route}
            className={`community__chapter community__chapter--${chapter.key}`} aria-label={chapter.label.text}
            style={{ ...mediaStyle(chapter.image), '--caption-x': chapter.labelX, '--caption-y': chapter.labelY,
              '--caption-width': chapter.label.width }}>
            <span className="community__chapter-image">
              {chapter.layers.map(item => <img key={item.nodeId} src={`/assets/${item.path}`}
                width={item.width} height={item.height} alt="" />)}
            </span>
            <span className="community__chapter-label"><FigmaLabel label={chapter.label} /></span>
            <span className="community__chapter-text">{chapter.label.text}</span>
          </Link>)}
        </div> : <div className="community__gallery">
          {page.media.map(item => <img key={item.nodeId} src={`/assets/${item.path}`}
            width={item.width} height={item.height} alt={item.alt} style={mediaStyle(item)} />)}
        </div>}
      </motion.main>
    </AnimatePresence>
  </SubpageLayout>;
}
