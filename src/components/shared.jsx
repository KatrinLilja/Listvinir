import { useApp } from '../context.js';
import { CHOICES, metaLine, priceText, tierOf, title } from '../lib/ranking.js';

export function SrcTag({ work }) {
  const { openSrc } = useApp();
  if (!work.src) return <span className="srctag none">Engin heimild</span>;
  return (
    <button
      className="srctag"
      aria-label={`Heimildir fyrir ${work.artist}, ${work.title}`}
      onClick={(e) => {
        e.stopPropagation();
        openSrc(work.id);
      }}
    >
      Heimild
    </button>
  );
}

export function Label({ work, price }) {
  return (
    <div className="lhead">
      <p className="bignum num">{work.id}</p>
      <p className="artist">{work.artist}</p>
      <p className="work t">{title(work)}</p>
      <p className="meta">{metaLine(work)}</p>
      {price && (
        <p className="pline num">
          <b>Áætlað verð: {priceText(work)}</b> <span>Öryggi: {work.conf}</span> <SrcTag work={work} />
        </p>
      )}
    </div>
  );
}

export function Choices({ id, onChoose }) {
  const { state } = useApp();
  const cur = tierOf(state, id);
  return (
    <div className="choices" role="group" aria-label="Veldu flokk">
      {CHOICES.map(([t, n]) => (
        <button key={t} className="choice" aria-pressed={cur === t} onClick={() => onChoose(t)}>
          <span className={`dot ${t}`}></span>
          {n}
        </button>
      ))}
    </div>
  );
}

const URL_RE = /(\bwww\.[^\s,]*[^\s,.])/g;
export function Bio({ work }) {
  return (
    <div className="biotext">
      {work.bio.map((p, i) => (
        <p key={i}>
          {p.split(URL_RE).map((part, k) =>
            k % 2 ? (
              <a key={k} href={`https://${part}`} target="_blank" rel="noopener noreferrer">{part}</a>
            ) : (
              part
            ),
          )}
        </p>
      ))}
    </div>
  );
}

export function SourceLinks({ work }) {
  return (
    <div className="srclinks">
      {work.src.map((s) => (
        <p key={s.u}>
          <a href={s.u} target="_blank" rel="noopener noreferrer">{s.n}</a>
          <span>{s.t}</span>
        </p>
      ))}
    </div>
  );
}
