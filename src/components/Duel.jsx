import { useState } from 'react';
import { useApp } from '../context.js';
import { TIERS, WORKS, byId, estimate, remaining, shortPrice, startDuel, tierName, title, undoDuel } from '../lib/ranking.js';
import { SrcTag } from './shared.jsx';

function Side({ id, res, showPrice }) {
  const { chooseDuel, openWork } = useApp();
  const w = byId[id];
  return (
    <div className="side">
      <button className="pick" data-res={res} aria-label={`Velja ${w.artist}, ${w.title}`} onClick={() => chooseDuel(res)}>
        <img src={`images/${id}.jpg`} alt={`${w.artist}: ${w.title}`} />
      </button>
      <div className="sidecap">
        <div>
          <p className="a">{w.artist}</p>
          <p className="t">{title(w)}</p>
          {showPrice && <p className="pr num">{shortPrice(w)} <SrcTag work={w} /></p>}
        </div>
        <button className="link" onClick={() => openWork(id)}>Nánar</button>
      </div>
    </div>
  );
}

export default function Duel() {
  const { state, apply, chooseDuel } = useApp();
  const d = state.duel;
  const [showPrice, setShowPrice] = useState(false);

  if (!d) {
    const all = WORKS.length;
    const untouched = state.tiers.none.length === all;
    const opts = [
      ...(untouched ? [] : TIERS.filter(([t]) => state.tiers[t].length).map(([t, n]) => [t, n, state.tiers[t].length])),
      ['all', 'Öll verkin', all],
    ];
    const begin = (scope) => {
      apply((s) => startDuel(s, scope));
      window.scrollTo(0, 0);
    };
    return (
      <>
        <div className="head">
          <h2>Hvaða verk er betra?</h2>
          <p>Þú velur á milli tveggja verka þar til röðin er komin. {untouched ? 'Fljótlegra er að flokka verkin fyrst, þá þarf færri val.' : 'Veldu hvaða flokk á að raða.'}</p>
        </div>
        <div className="scopes">
          {opts.map(([s, n, c]) => (
            <button key={s} className="scope" data-scope={s} disabled={c < 2} onClick={() => begin(s)}>
              <b>{s !== 'all' && <span className={`dot ${s}`}></span>}{n}</b>
              <span className="num">{c} verk · um {estimate(c)} val</span>
            </button>
          ))}
        </div>
        {untouched && <p style={{ marginTop: 14 }}><a className="link" href="#flokka">Flokka verkin fyrst</a></p>}
      </>
    );
  }

  const mid = (d.lo + d.hi) >> 1;
  const pivot = d.sorted[mid];
  const left = d.done % 2 ? d.cur : pivot;
  const right = d.done % 2 ? pivot : d.cur;
  const rem = remaining(d);
  const pct = Math.round((100 * d.done) / (d.done + rem));
  return (
    <>
      <div className="duelhead">
        <h2>Hvort er betra?</h2>
        <p className="num">{d.scope === 'all' ? 'Öll verkin' : tierName[d.scope]} · um {rem} val eftir</p>
      </div>
      <div className="prog"><i style={{ width: `${pct}%` }}></i></div>
      <div className="vs">
        <Side id={left} res={left === d.cur ? 'cur' : 'pivot'} showPrice={showPrice} />
        <Side id={right} res={right === d.cur ? 'cur' : 'pivot'} showPrice={showPrice} />
      </div>
      <div className="duelbar">
        <button className="link" onClick={() => setShowPrice((v) => !v)}>{showPrice ? 'Fela verð' : 'Sýna verð'}</button>
        <button className="link" data-duel="tie" onClick={() => chooseDuel('tie')}>Get ekki valið</button>
        <button className="link" data-duel="undo" disabled={!d.hist.length} onClick={() => apply(undoDuel)}>Til baka</button>
        <button className="link" data-duel="quit" onClick={() => apply((s) => { s.duel = null; })}>Hætta í einvíginu</button>
      </div>
    </>
  );
}
