import './FigmaLabel.css';

export default function FigmaLabel({ label }) {
  return <span className="figma-label" style={{
    '--label-width': label.width,
    '--label-height': label.height,
    '--label-art-width': label.artWidth,
    '--label-x': label.offsetX,
    '--label-y': label.offsetY,
  }}>
    <span className="figma-label__text">{label.text}</span>
    <img src={`/assets/${label.path}`} width={label.artWidth} height={label.artHeight} alt="" />
  </span>;
}
