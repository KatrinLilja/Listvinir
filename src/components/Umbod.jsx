import { useRef, useState } from 'react';
import { useApp } from '../context.js';
import { WORKS, byId, flat, shortPrice, sortedCount, tierOf, title } from '../lib/ranking.js';
import { parseList } from '../lib/exports.js';
import { SrcTag } from './shared.jsx';

const whoName = (s, who) => (who === 'me' ? 'Þú' : (s.proxies.find((p) => p.id === who) || {}).name || '');

function PersonCard({ person: p, confirmRemove, setConfirmRemove }) {
  const { state, apply, toast, openWork } = useApp();
  const pTier = (id) => (p.tier ? p.tier[id] || 'none' : tierOf(state, id));
  const free = p.order.filter((id) => !(id in state.taken));
  const next = free[0];
  const w = next && byId[next];
  const t = next && pTier(next);
  const picks = p.order.filter((id) => state.taken[id] === p.id);
  const take = (id) => {
    if (Object.values(state.taken).includes(p.id)) {
      toast('Hver og einn má aðeins fá eitt verk');
      return;
    }
    apply((s) => { s.taken[id] = p.id; });
  };
  const remove = () => {
    apply((s) => {
      s.proxies = s.proxies.filter((x) => x.id !== p.id);
      for (const k of Object.keys(s.taken)) if (s.taken[k] === p.id) s.taken[k] = '';
    });
    setConfirmRemove(null);
  };
  return (
    <article className="px">
      <div className="pxhead">
        {p.id === 'me' ? (
          <p className="pxname">Þú</p>
        ) : (
          <input
            key={p.name}
            className="pxname"
            id={`name-${p.id}`}
            defaultValue={p.name}
            aria-label="Nafn"
            onBlur={(e) => {
              const v = e.target.value.trim().slice(0, 60);
              if (v && v !== p.name) apply((s) => { s.proxies.find((x) => x.id === p.id).name = v; });
            }}
          />
        )}
      </div>
      {picks.length > 0 ? (
        <>
          {picks.length > 1 && <p className="pxwarn">Búið er að velja {picks.length} verk. Hver og einn má aðeins fá eitt, svo hættu við það sem á ekki að standa.</p>}
          {picks.map((id) => {
            const x = byId[id];
            return (
              <div className="pxnext" key={id}>
                <button className="pxthumb" aria-label={`Skoða ${x.artist}, ${x.title}`} onClick={() => openWork(id)}><img src={`thumbs/${id}.jpg`} alt="" /></button>
                <div className="pxinfo">
                  <p className="lbl"><span className={`dot ${pTier(id)}`}></span>Valið · sæti {p.order.indexOf(id) + 1}</p>
                  <p className="a">{x.artist}</p>
                  <p className="t">{title(x)}</p>
                  <p className="pr num">{shortPrice(x)} <SrcTag work={x} /></p>
                  <button className="link" data-untake={id} onClick={() => apply((s) => { delete s.taken[id]; })}>Hætta við val</button>
                </div>
              </div>
            );
          })}
        </>
      ) : w ? (
        <>
          <div className="pxnext">
            <button className="pxthumb" aria-label={`Skoða ${w.artist}, ${w.title}`} onClick={() => openWork(w.id)}><img src={`thumbs/${w.id}.jpg`} alt="" /></button>
            <div className="pxinfo">
              <p className="lbl"><span className={`dot ${t}`}></span>Næsta val · sæti {p.order.indexOf(w.id) + 1}</p>
              <p className="a">{w.artist}</p>
              <p className="t">{title(w)}</p>
              <p className="pr num">{shortPrice(w)} <SrcTag work={w} /></p>
              {(t === 'pass' || t === 'none') && <p className="warn">Þetta verk er {t === 'pass' ? 'í flokki 4' : 'óflokkað'} á listanum.</p>}
            </div>
          </div>
          <button className="btn pxtake" onClick={() => take(w.id)}>Velja fyrir {p.id === 'me' ? 'mig' : p.name}</button>
        </>
      ) : (
        <p className="hint">Öll verkin á þessum lista eru tekin.</p>
      )}
      <details className="pxlist">
        <summary>Allur listinn</summary>
        <ol>
          {p.order.map((id, i) => {
            const x = byId[id];
            const isT = id in state.taken;
            return (
              <li key={id} className={isT ? 'gone' : ''}>
                <span className="num r">{i + 1}</span>
                <span className={`dot ${pTier(id)}`}></span>
                <button className="nm" onClick={() => openWork(id)}>{x.artist}, <span className="t">{x.title}</span></button>
                {isT ? (
                  <span className="st">{state.taken[id] ? whoName(state, state.taken[id]) : 'Tekið'}</span>
                ) : picks.length ? null : (
                  <button className="link" data-velja={id} onClick={() => take(id)}>Velja</button>
                )}
              </li>
            );
          })}
        </ol>
      </details>
      {p.id !== 'me' && (
        <div className="pxrm">
          {confirmRemove === p.id ? (
            <>
              <span>Fjarlægja lista?</span>
              <button className="link" onClick={remove}>Já, fjarlægja</button>
              <button className="link" onClick={() => setConfirmRemove(null)}>Hætta við</button>
            </>
          ) : (
            <button className="link" onClick={() => setConfirmRemove(p.id)}>Fjarlægja lista</button>
          )}
        </div>
      )}
    </article>
  );
}

export default function Umbod() {
  const { state, apply } = useApp();
  const [name, setName] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const file = useRef(null);

  const upload = async (f) => {
    const nm = name.trim();
    if (!nm) {
      setMsg({ text: 'Skrifaðu nafn áður en þú velur skjal.', err: true });
      return;
    }
    if (f.size > 5e6) {
      setMsg({ text: 'Skjalið er of stórt. Notaðu Excel-skjalið sem kemur af síðunni.', err: true });
      return;
    }
    setBusy(true);
    setMsg({ text: 'Les skjalið…' });
    try {
      const { order, tier, missing } = await parseList(f);
      let replaced = false;
      apply((s) => {
        const old = s.proxies.find((p) => p.name.toLowerCase() === nm.toLowerCase());
        if (old) {
          replaced = true;
          Object.assign(old, { order, tier, name: nm });
        } else {
          s.proxies.push({ id: 'p' + Date.now().toString(36), name: nm, order, tier });
        }
      });
      setName('');
      setMsg({ text: `${replaced ? 'Listi uppfærður' : 'Listi bættur við'}: ${nm}.${missing ? ` ${missing} verk vantaði í skjalið og eru neðst á listanum.` : ''}` });
    } catch (e) {
      setMsg({
        err: true,
        text: e && e.message === 'format' ? 'Þetta skjal er ekki listi af þessari síðu. Notaðu skjalið úr Sækja Excel-skjal á flipanum Listinn.' : 'Ekki tókst að lesa skjalið. Reyndu aftur.',
      });
    }
    setBusy(false);
  };
  const toggleTaken = (id) =>
    apply((s) => {
      if (id in s.taken) delete s.taken[id];
      else s.taken[id] = '';
    });

  const people = [...(sortedCount(state) ? [{ id: 'me', name: 'Þú', order: flat(state), tier: null }] : []), ...state.proxies];
  const takenN = Object.keys(state.taken).length;

  return (
    <>
      <div className="head">
        <h2>Umboð</h2>
        <p>Haltu utan um lista þeirra sem komast ekki. Listarnir sjást aðeins hjá þér.</p>
      </div>
      <ol className="steps">
        <li>Viðkomandi býr til sinn lista á þessari síðu.</li>
        <li>Viðkomandi velur <b>Sækja Excel-skjal</b> á flipanum Listinn og sendir þér skjalið.</li>
        <li>Þú skrifar nafnið hér og hleður skjalinu upp.</li>
      </ol>
      <form className="upl" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="uname">Nafn</label>
        <input id="uname" autoComplete="off" maxLength={60} value={name} placeholder="Nafn þess sem gefur umboð" onChange={(e) => setName(e.target.value)} />
        <label className={`btn upbtn ${busy ? 'off' : ''}`} htmlFor="ufile">Hlaða upp Excel-skjali</label>
        <input
          id="ufile"
          ref={file}
          className="vh"
          type="file"
          accept=".xlsx,.xls"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files[0];
            if (f) upload(f);
            e.target.value = '';
          }}
        />
      </form>
      {msg && <p className={`umsg ${msg.err ? 'err' : ''}`} role="status">{msg.text}</p>}
      {people.length ? (
        <section className="srcsec">
          <h3 className="tierh">Listar <small className="num">{people.length} {people.length === 1 ? 'listi' : 'listar'}</small></h3>
          <p className="hint">Listarnir sleppa teknum verkum og sýna næsta val. Hver og einn fær eitt verk.</p>
          <div className="pxs">
            {people.map((p) => <PersonCard key={p.id} person={p} confirmRemove={confirmRemove} setConfirmRemove={setConfirmRemove} />)}
          </div>
        </section>
      ) : (
        <p className="hint">Engir listar komnir enn.</p>
      )}
      <section className="srcsec">
        <h3 className="tierh">Tekin verk <small className="num">{takenN} af {WORKS.length}</small></h3>
        <p className="hint">Smelltu á verk þegar einhver annar velur það. Smelltu aftur til að losa það.</p>
        <div className="tks">
          {WORKS.map((w) => {
            const has = w.id in state.taken;
            return (
              <button key={w.id} className={`tk ${has ? 'on' : ''}`} data-tk={w.id} aria-pressed={has} aria-label={`${w.id} ${w.artist}, ${w.title}`} onClick={() => toggleTaken(w.id)}>
                <span className="pic"><img src={`thumbs/${w.id}.jpg`} alt="" loading="lazy" /></span>
                <span className="cap"><span className="num">{w.id}</span> {w.artist}</span>
                {has && <span className="flag">{whoName(state, state.taken[w.id]) || 'Tekið'}</span>}
              </button>
            );
          })}
        </div>
        {takenN > 0 && (
          <div className="reset">
            {confirmClear ? (
              <>
                <span>Losa öll tekin verk?</span>
                <button className="btn" onClick={() => { apply((s) => { s.taken = {}; }); setConfirmClear(false); }}>Já, losa öll</button>
                <button className="link" onClick={() => setConfirmClear(false)}>Hætta við</button>
              </>
            ) : (
              <button className="link" onClick={() => setConfirmClear(true)}>Losa öll tekin verk</button>
            )}
          </div>
        )}
      </section>
    </>
  );
}
