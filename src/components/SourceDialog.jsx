import { byId, priceText, title } from '../lib/ranking.js';
import { SourceLinks } from './shared.jsx';
import { useModal } from './useModal.js';

export default function SourceDialog({ id, onClose }) {
  const ref = useModal(!!id);
  const w = id && byId[id];
  return (
    <dialog ref={ref} id="srcdlg" aria-label="Heimildir verðs" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {w && (
        <>
          <button className="close" id="srcclose" onClick={onClose}>Loka</button>
          <div className="srcpop">
            <h3 className="tierh">Heimildir</h3>
            <p className="srcfor"><b>{w.artist}</b> <span className="t">{title(w)}</span></p>
            <p className="srcprice num">Áætlað verð: {priceText(w)}</p>
            <SourceLinks work={w} />
            <p className="hint">Heimildin sýnir viðmið. Bilið er gróf áætlun út frá henni.</p>
          </div>
        </>
      )}
    </dialog>
  );
}
