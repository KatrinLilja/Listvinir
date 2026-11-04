import { useApp } from '../context.js';
import { WORKS, assign, byId, moveTo, priceText, rankOf } from '../lib/ranking.js';
import { Bio, Choices, Label, SrcTag } from './shared.jsx';
import { useModal } from './useModal.js';

export default function WorkDialog({ id, onClose }) {
  const { state, apply } = useApp();
  const ref = useModal(!!id);
  const w = id && byId[id];
  const rank = id ? rankOf(state, id) : 0;
  const setRank = (v) => {
    if (v >= 1 && v <= WORKS.length && v !== rank) apply((s) => moveTo(s, id, v));
  };
  return (
    <dialog ref={ref} id="dlg" aria-label="Um verkið" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {w && (
        <>
          <button className="close" id="dlgclose" onClick={onClose}>Loka</button>
          <div className="dlg">
            <div className="dlgpics">
              <img src={`images/${w.id}.jpg`} alt={`${w.artist}: ${w.title}`} />
              {w.extra && <img src={`images/${w.extra}.jpg`} alt={`${w.title} í notkun`} />}
            </div>
            <div className="dlginfo">
              <Label work={w} />
              <Choices id={w.id} onChoose={(t) => apply((s) => assign(s, w.id, t))} />
              <div className="rankctl">
                <label htmlFor="rankin">Sæti</label>
                <input
                  key={rank}
                  id="rankin"
                  className="num"
                  type="number"
                  min="1"
                  max={WORKS.length}
                  defaultValue={rank}
                  onBlur={(e) => setRank(parseInt(e.target.value, 10))}
                  onKeyDown={(e) => { if (e.key === 'Enter') setRank(parseInt(e.target.value, 10)); }}
                />
                <button onClick={() => setRank(rank - 1)}>Ofar</button>
                <button onClick={() => setRank(rank + 1)}>Neðar</button>
              </div>
              <div className="price">
                <b>Áætlað verð: {priceText(w)}</b>
                <div><SrcTag work={w} /></div>
                <span>Öryggi: {w.conf}. {w.basis}</span>
              </div>
              <Bio work={w} />
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
