import { useEffect, useState } from 'react';
import { useApp } from '../context.js';
import { WORKS, byId, tierName, tierOf } from '../lib/ranking.js';
import { Bio, Choices, Label } from './shared.jsx';

export default function Sort() {
  const { state, apply, sortWork } = useApp();
  const [bioOpen, setBioOpen] = useState(false);
  const w = byId[state.cur];
  const i = WORKS.indexOf(w);
  const go = (k) => apply((s) => { s.cur = WORKS[k].id; });

  useEffect(() => {
    const next = WORKS[i + 1];
    if (next) new Image().src = `images/${next.id}.jpg`;
  }, [i]);

  return (
    <>
      {!state.tiers.none.length && (
        <div className="notice">
          <p>Öll {WORKS.length} verkin eru flokkuð. Næst skaltu fínstilla röðina.</p>
          <a href="#rada">Raða með því að draga</a>
          <a href="#einvigi">Velja í einvígi</a>
        </div>
      )}
      <div className="sortv">
        <div className="hang">
          <img key={w.id} src={`images/${w.id}.jpg`} alt={`${w.artist}: ${w.title}`} />
        </div>
        <div className="label">
          <Label work={w} price />
          <Choices id={w.id} onChoose={(t) => sortWork(w.id, t)} />
          <div className="pager">
            <button className="link" disabled={!i} onClick={() => go(i - 1)}>Fyrra verk</button>
            <span className="num">Verk {i + 1} af {WORKS.length}</span>
            <button className="link" disabled={i === WORKS.length - 1} onClick={() => go(i + 1)}>Næsta verk</button>
          </div>
          <details className="bio" open={bioOpen} onToggle={(e) => setBioOpen(e.currentTarget.open)}>
            <summary>Um listamanninn og verkið</summary>
            <Bio work={w} />
          </details>
        </div>
      </div>
      <div className="rail" aria-label="Öll verkin">
        {WORKS.map((x, k) => {
          const t = tierOf(state, x.id);
          return (
            <button key={x.id} aria-current={x.id === w.id ? 'true' : 'false'} title={`${x.id} ${x.artist}`} aria-label={`Verk ${x.id}, ${tierName[t]}`} onClick={() => go(k)}>
              <span className={`dot ${t}`}></span>
            </button>
          );
        })}
      </div>
    </>
  );
}
