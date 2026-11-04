import { useRef, useState } from 'react';
import { useApp } from '../context.js';
import { WORKS, blank, byId, flat, kr, metaLine, priceText, sortedCount, tierName, tierOf, title } from '../lib/ranking.js';
import { asText, exportPdf, exportXlsx } from '../lib/exports.js';
import { SrcTag } from './shared.jsx';

export default function List() {
  const { state, apply, toast, nav, openWork } = useApp();
  const [busy, setBusy] = useState('');
  const [fallback, setFallback] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const area = useRef(null);
  const ids = flat(state);
  const n = sortedCount(state);
  const top = n ? ids.slice(0, 3) : [];

  const run = async (key, fn) => {
    setBusy(key);
    try {
      await fn(state);
    } catch (e) {
      toast('Ekki tókst að búa til skjalið. Reyndu aftur.');
    }
    setBusy('');
  };
  const copy = async () => {
    const text = asText(state);
    try {
      await navigator.clipboard.writeText(text);
      toast('Listinn er afritaður');
    } catch (e) {
      setFallback(text);
      setTimeout(() => {
        area.current?.focus();
        area.current?.select();
      }, 0);
      toast('Afritaðu textann úr reitnum');
    }
  };
  const reset = () => {
    apply((s) => {
      const { proxies, taken } = s;
      Object.assign(s, blank(), { proxies, taken });
    });
    setConfirmReset(false);
    nav('flokka');
  };

  return (
    <>
      <div className="head">
        <h2>Listinn þinn</h2>
        <p>{n === WORKS.length ? 'Frá besta til versta.' : `${n} af ${WORKS.length} verkum eru flokkuð. Óflokkuð verk eru neðst í númeraröð.`}</p>
      </div>
      <div className="actions">
        <button className="btn" id="xcopy" onClick={copy}>Afrita sem texta</button>
        <button className="btn q" id="xpdf" disabled={!!busy} onClick={() => run('pdf', exportPdf)}>{busy === 'pdf' ? 'Augnablik…' : 'Sækja PDF til að prenta'}</button>
        <button className="btn q" id="xxlsx" disabled={!!busy} onClick={() => run('xlsx', exportXlsx)}>{busy === 'xlsx' ? 'Augnablik…' : 'Sækja Excel-skjal'}</button>
      </div>
      <p className="hint">PDF-skjalið er með myndum og tilbúið til prentunar.</p>
      <p className="sum">
        <b className="num">Samanlagt áætlað verð: {kr(WORKS.reduce((a, w) => a + w.low, 0))}–{kr(WORKS.reduce((a, w) => a + w.high, 0))} kr.</b>{' '}
        Þetta er gróf áætlun, ekki formlegt verðmat. Raunverulegt söluverð getur verið annað. Smelltu á verk til að sjá forsendur.
      </p>
      {fallback && <textarea id="fallback" ref={area} readOnly value={fallback} aria-label="Listinn sem texti" />}
      {top.length === 3 && (
        <div className="top">
          {top.map((id, i) => {
            const w = byId[id];
            return (
              <button className="card" key={id} onClick={() => openWork(id)}>
                <span className="pic"><img src={`thumbs/${id}.jpg`} alt={`${w.artist}: ${w.title}`} /></span>
                <span className="place num">{i + 1}</span>
                <span><span className="a">{w.artist}</span><span className="t">{w.title}</span></span>
              </button>
            );
          })}
        </div>
      )}
      <ol className="rows">
        {ids.map((id, i) => {
          const w = byId[id];
          const t = tierOf(state, id);
          return (
            <li key={id}>
              <div
                className="row"
                role="button"
                tabIndex={0}
                onClick={() => openWork(id)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
                    e.preventDefault();
                    openWork(id);
                  }
                }}
              >
                <span className="r">{i + 1}</span>
                <span className="th"><img src={`thumbs/${id}.jpg`} alt="" loading="lazy" /></span>
                <span>
                  <span className="a">{w.artist}</span>
                  <span className="t">{title(w)}</span>
                  <span className="pm num">{priceText(w)} <SrcTag work={w} /></span>
                </span>
                <span className="m">{metaLine(w)}</span>
                <span className="p num">{priceText(w)}<SrcTag work={w} /></span>
                <span className={`dot ${t}`} title={tierName[t]}></span>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="reset">
        {confirmReset ? (
          <>
            <span>Á að eyða allri röðuninni?</span>
            <button className="btn" id="resetyes" onClick={reset}>Já, byrja upp á nýtt</button>
            <button className="link" onClick={() => setConfirmReset(false)}>Hætta við</button>
          </>
        ) : (
          <button className="link" id="reset" onClick={() => setConfirmReset(true)}>Byrja upp á nýtt</button>
        )}
      </div>
    </>
  );
}
