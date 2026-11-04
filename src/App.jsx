import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from './context.js';
import { CHOICES, WORKS, assign, load, nextUnsorted, pickDuel, save, sortedCount } from './lib/ranking.js';
import Sort from './components/Sort.jsx';
import Board from './components/Board.jsx';
import Duel from './components/Duel.jsx';
import List from './components/List.jsx';
import Umbod from './components/Umbod.jsx';
import Sources from './components/Sources.jsx';
import WorkDialog from './components/WorkDialog.jsx';
import SourceDialog from './components/SourceDialog.jsx';
import ShareDialog, { ImportDialog } from './components/ShareDialog.jsx';
import { readShareHash, unpackState } from './lib/share.js';

const VIEWS = [
  ['flokka', 'Flokka'],
  ['rada', 'Raða'],
  ['einvigi', 'Einvígi'],
  ['listi', 'Listinn'],
  ['umbod', 'Umboð'],
  ['heimildir', 'Heimildir'],
];
const readView = () => {
  const h = location.hash.slice(1);
  return VIEWS.some(([v]) => v === h) ? h : 'flokka';
};

export default function App() {
  const [state, setState] = useState(load);
  const stateRef = useRef(state);
  const [view, setView] = useState(readView);
  const [workId, setWorkId] = useState(null);
  const [srcId, setSrcId] = useState(null);
  const [toastText, setToastText] = useState('');
  const [saved, setSaved] = useState('Vistað í þessum vafra');
  const toastTimer = useRef();
  const [sharing, setSharing] = useState(false);
  const [incoming, setIncoming] = useState(null);

  const toast = useCallback((text) => {
    setToastText(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastText(''), 3000);
  }, []);

  // Every change goes through here, so rapid key presses always build on the latest state.
  const apply = useCallback((fn) => {
    const next = structuredClone(stateRef.current);
    fn(next);
    next.updatedAt = Date.now();
    stateRef.current = next;
    setState(next);
    setSaved(save(next) ? 'Vistað í þessum vafra' : 'Ekki vistað');
    return next;
  }, []);

  const nav = useCallback((v) => {
    location.hash = v;
  }, []);

  // A share link carries the list in the hash. Read it, then drop it from the address bar.
  const checkShare = useCallback(() => {
    const packed = readShareHash();
    if (!packed) return false;
    history.replaceState(null, '', location.pathname + location.search);
    setSharing(false);
    try {
      setIncoming(unpackState(packed));
    } catch (e) {
      toast('Ekki tókst að lesa listann úr hlekknum');
    }
    return true;
  }, [toast]);

  const acceptIncoming = useCallback(() => {
    const local = stateRef.current;
    apply((s) => {
      Object.assign(s, structuredClone(incoming), { taken: local.taken });
    });
    setIncoming(null);
    toast('Listinn er kominn í þetta tæki');
  }, [apply, incoming, toast]);

  useEffect(() => {
    checkShare();
    const onHash = () => {
      if (checkShare()) return;
      setView(readView());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [checkShare]);

  const chooseDuel = useCallback(
    (res) => {
      const scope = stateRef.current.duel.scope;
      const next = apply((s) => pickDuel(s, res));
      if (!next.duel) {
        toast(scope === 'all' ? 'Röðin er komin á listann' : `${CHOICES.find(([t]) => t === scope)?.[1] || 'Óflokkuð'}: röðin er komin á listann`);
        nav('listi');
      }
    },
    [apply, nav, toast],
  );

  const sortWork = useCallback(
    (id, tier) => {
      apply((s) => {
        assign(s, id, tier);
        const n = nextUnsorted(s, id);
        if (n) s.cur = n;
      });
    },
    [apply],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (workId || srcId || sharing || incoming || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      const s = stateRef.current;
      if (view === 'flokka') {
        const i = WORKS.findIndex((w) => w.id === s.cur);
        if (['1', '2', '3', '4'].includes(e.key)) sortWork(s.cur, CHOICES[+e.key - 1][0]);
        else if (e.key === 'ArrowLeft' && i > 0) apply((n) => { n.cur = WORKS[i - 1].id; });
        else if (e.key === 'ArrowRight' && i < WORKS.length - 1) apply((n) => { n.cur = WORKS[i + 1].id; });
      }
      if (view === 'einvigi' && s.duel) {
        const picks = [...document.querySelectorAll('.pick')];
        if (e.key === 'ArrowLeft') chooseDuel(picks[0].dataset.res);
        else if (e.key === 'ArrowRight') chooseDuel(picks[1].dataset.res);
        else if (e.key === 'ArrowDown') {
          e.preventDefault();
          chooseDuel('tie');
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [apply, chooseDuel, incoming, sharing, sortWork, srcId, view, workId]);

  const ctx = useMemo(
    () => ({ state, apply, toast, nav, chooseDuel, sortWork, openWork: setWorkId, openSrc: setSrcId }),
    [state, apply, toast, nav, chooseDuel, sortWork],
  );

  return (
    <AppContext.Provider value={ctx}>
      <header className="bar gutter">
        <div className="wrap barin">
          <h1 className="brand">Listvinir 2026</h1>
          <nav aria-label="Skref">
            {VIEWS.map(([v, label]) => (
              <a key={v} href={`#${v}`} aria-current={view === v ? 'page' : undefined}>
                {label}
              </a>
            ))}
          </nav>
          <div className="status num">
            <span>{sortedCount(state)}/{WORKS.length} flokkuð</span>
            <span aria-live="polite">{saved}</span>
            <button className="sharebtn" onClick={() => setSharing(true)}>Flytja lista</button>
          </div>
        </div>
      </header>
      <main className="gutter">
        <div className="wrap">
          {view === 'flokka' && <Sort />}
          {view === 'rada' && <Board />}
          {view === 'einvigi' && <Duel />}
          {view === 'listi' && <List />}
          {view === 'umbod' && <Umbod />}
          {view === 'heimildir' && <Sources />}
        </div>
      </main>
      <WorkDialog id={workId} onClose={() => setWorkId(null)} />
      <SourceDialog id={srcId} onClose={() => setSrcId(null)} />
      <ShareDialog open={sharing} state={state} onClose={() => setSharing(false)} toast={toast} />
      <ImportDialog incoming={incoming} onAccept={acceptIncoming} onCancel={() => setIncoming(null)} />
      <div id="toast" role="status" hidden={!toastText}>{toastText}</div>
    </AppContext.Provider>
  );
}
