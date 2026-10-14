import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, Navigate, useParams } from 'react-router-dom';
import FigmaLabel from '../components/FigmaLabel.jsx';
import SubpageLayout from '../components/SubpageLayout.jsx';
import useReducedMotion from '../lib/useReducedMotion.js';
import { pages, navigationLabels, arrows } from '../data/spiritualityPages.json';
import './Spirituality.css';

const branches = {
  wuxing: pages.filter(page => page.group === 'wuxing'),
  planets: pages.filter(page => page.group === 'planets'),
};

function mediaStyle(item) {
  return { '--media-x': item.x, '--media-y': item.y, '--media-width': item.width, '--media-height': item.height,
    '--relative-x': item.relativeX, '--relative-y': item.relativeY,
    '--relative-width': item.relativeWidth, '--relative-height': item.relativeHeight };
}

export default function Spirituality() {
  const { branch, topic = 'intro' } = useParams();
  const page = branch ? pages.find(item => item.group === branch && item.topic === topic) : pages[0];
  const reduced = useReducedMotion();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [branch, topic]);
  if (!page) return <Navigate to={branches[branch] ? `/spirituality/${branch}` : '/spirituality'} replace />;
  const sectionPages = branches[page.group] || pages;
  const index = sectionPages.findIndex(item => item.route === page.route);
  return <SubpageLayout page={page} pages={sectionPages} section="spirituality" navigationLabels={navigationLabels}
    contentId="spirituality-content" showPagination={Boolean(page.group)}
    paginationLabel={page.group === 'wuxing' ? 'Wuxing screens' : 'Planets screens'}>
    <AnimatePresence mode="wait" initial={false}>
      <motion.main key={page.key} id="spirituality-content" tabIndex={-1}
        className={`spirit__frame spirit__frame--${page.key}`} aria-label={page.name}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.25 }}
        style={{ '--title-x': page.titleX, '--title-y': page.titleY, '--body-x': page.bodyX,
          '--body-y': page.bodyY, '--body-width': page.bodyWidth, '--body-font-size': page.bodyFontSize }}>
        <div className="spirit__heading">
          <h1 className="spirit__title"><FigmaLabel label={page.title} /></h1>
          {page.subtitle?.tag && <span className="spirit__tag"
            style={{ '--tag-x': page.subtitle.x, '--tag-y': page.subtitle.y }}>{page.subtitle.text}</span>}
        </div>
        {page.subtitle && !page.subtitle.tag && <h2 className="spirit__subtitle"
          style={{ '--subtitle-x': page.subtitle.x, '--subtitle-y': page.subtitle.y,
            '--subtitle-width': page.subtitle.width }}>{page.subtitle.text}</h2>}
        <p className="spirit__body">{page.body}</p>
        {!page.group ? <div className="spirit__choices">
          {page.chapters.map(chapter => <Link key={chapter.group} to={chapter.route} className="spirit__choice"
            aria-label={chapter.group === 'wuxing' ? 'Wuxing' : 'Planets'}
            style={{ ...mediaStyle(chapter.image), '--caption-x': chapter.labelX, '--caption-y': chapter.labelY }}>
            <img src={`/assets/${chapter.image.path}`} width={chapter.image.width} height={chapter.image.height} alt="" />
            <span className="spirit__choice-label"><FigmaLabel label={chapter.label} /></span>
          </Link>)}
        </div> : page.media.length > 0 && <div className="spirit__gallery"
          style={{ '--gallery-width': page.galleryWidth, '--gallery-height': page.galleryHeight }}>
          {page.media.map(item => <img key={item.nodeId} src={`/assets/${item.path}`}
            width={item.width} height={item.height} alt={item.alt} style={mediaStyle(item)} />)}
        </div>}
        {page.group && <nav className="spirit__arrows" aria-label="Previous and next screen">
          <Link className="spirit__arrow spirit__arrow--previous" aria-label={`Previous ${page.group} screen`}
            to={sectionPages[(index - 1 + sectionPages.length) % sectionPages.length].route}>
            <img src={`/assets/${arrows.previous}`} width="24" height="15" alt="" />
          </Link>
          <Link className="spirit__arrow spirit__arrow--next" aria-label={`Next ${page.group} screen`}
            to={sectionPages[(index + 1) % sectionPages.length].route}>
            <img src={`/assets/${arrows.next}`} width="24" height="15" alt="" />
          </Link>
        </nav>}
      </motion.main>
    </AnimatePresence>
  </SubpageLayout>;
}
