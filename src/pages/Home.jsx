import './Home.css';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'About Me',
    route: '/about-me',
    artwork: 'about',
    width: 229,
    height: 27,
    offset: [0.51953125, 6],
    description: 'Get to know who Iam',
  },
  {
    title: 'Community',
    route: '/community',
    artwork: 'community',
    width: 260,
    height: 36,
    offset: [2.1240234375, 5.927734375],
    description: "Discovery the impact\nI've made together with others",
  },
  {
    title: 'inquiry',
    route: '/inquiry',
    artwork: 'inquiry',
    width: 163,
    height: 36,
    offset: [4.3037109375, 5.927734375],
    description: 'Explore my academic journey\nand project',
  },
  {
    title: 'Sprituality',
    route: '/spirituality',
    artwork: 'spirituality',
    width: 236,
    height: 36,
    offset: [1.98046875, 5.927734375],
    description: 'Thought, growth\nand what guides me forward',
  },
];

function SectionLink({ section }) {
  return (
    <Link
      className={`home__link home__link--${section.artwork}`}
      to={section.route}
    >
      <span className="home__link-title">
        <span className="home__sr-only">{section.title}</span>
        <img
          src={`/assets/home/type/${section.artwork}.svg`}
          width={section.width}
          height={section.height}
          alt=""
          style={{
            '--art-width': section.width,
            '--art-height': section.height,
            '--art-x': section.offset[0],
            '--art-y': section.offset[1],
          }}
        />
      </span>
      <span className="home__description">{section.description}</span>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="home" aria-label="Ngô Bảo Châu">
      <img
        className="home__background"
        src="/assets/home/image-26__23-3@2x.webp"
        width="2880"
        height="1488"
        alt=""
        fetchPriority="high"
      />
      <div className="home__shade" aria-hidden="true" />
      <div className="home__canvas">
        <div className="home__content">
          <h1 className="home__title">
            <span className="home__sr-only">Bao Chau Universe</span>
            <img src="/assets/home/type/universe.svg" width="607" height="192" alt="" />
          </h1>
          <nav className="home__navigation" aria-label="Explore Bao Chau's universe">
            <div className="home__link-column home__link-column--left">
              {sections.slice(0, 2).map((section) => <SectionLink key={section.route} section={section} />)}
            </div>
            <div className="home__link-column home__link-column--right">
              {sections.slice(2).map((section) => <SectionLink key={section.route} section={section} />)}
            </div>
          </nav>
        </div>
      </div>
    </main>
  );
}
