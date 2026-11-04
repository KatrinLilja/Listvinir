import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { shareLink } from '../lib/share.js';
import { sortedCount, WORKS } from '../lib/ranking.js';
import { useModal } from './useModal.js';

export default function ShareDialog({ open, state, onClose, toast }) {
  const ref = useModal(open);
  const [link, setLink] = useState('');
  const [qr, setQr] = useState('');

  useEffect(() => {
    if (!open) return;
    const url = shareLink(state);
    setLink(url);
    // Always black on white: phone cameras read inverted codes poorly.
    QRCode.toDataURL(url, { errorCorrectionLevel: 'L', margin: 2, width: 560, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [open, state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast('Hlekkurinn er afritaður');
    } catch (e) {
      toast('Ekki tókst að afrita');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: 'Listvinir 2026', url: link });
    } catch (e) {
      /* The person closed the share sheet. */
    }
  };

  return (
    <dialog ref={ref} id="sharedlg" aria-label="Flytja listann" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open && (
        <>
          <button className="close" onClick={onClose}>Loka</button>
          <div className="sharepop">
            <h3 className="tierh">Flytja listann í annað tæki</h3>
            <p className="hint">Skannaðu kóðann með myndavél símans, eða sendu hlekkinn. Listinn ({sortedCount(state)}/{WORKS.length} flokkuð) opnast þá í hinu tækinu.</p>
            {qr ? <img className="qr" src={qr} alt="QR kóði með listanum" /> : <p className="hint">Gat ekki búið til QR kóða. Notaðu hlekkinn.</p>}
            <div className="sharebtns">
              <button className="btn" onClick={copy}>Afrita hlekk</button>
              {typeof navigator.share === 'function' && <button className="btn q" onClick={share}>Senda…</button>}
            </div>
            <p className="hint">Þetta er afrit eins og listinn er núna. Breytingar sem þú gerir síðar flytjast ekki sjálfkrafa.</p>
          </div>
        </>
      )}
    </dialog>
  );
}

export function ImportDialog({ incoming, onAccept, onCancel }) {
  const ref = useModal(!!incoming);
  return (
    <dialog ref={ref} id="importdlg" aria-label="Opna lista" onClose={onCancel}>
      {incoming && (
        <div className="sharepop">
          <h3 className="tierh">Opna lista úr öðru tæki?</h3>
          <p>Í listanum eru {sortedCount(incoming)}/{WORKS.length} verk flokkuð{incoming.proxies.length ? ` og ${incoming.proxies.length} umboð` : ''}.</p>
          <p className="hint">Þetta kemur í stað listans í þessu tæki.</p>
          <div className="sharebtns">
            <button className="btn" onClick={onAccept}>Já, nota þennan lista</button>
            <button className="btn q" onClick={onCancel}>Hætta við</button>
          </div>
        </div>
      )}
    </dialog>
  );
}
