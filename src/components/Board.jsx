import { useEffect, useRef } from 'react';
import Sortable from 'sortablejs';
import { useApp } from '../context.js';
import { TIERS, byId, shortPrice } from '../lib/ranking.js';
import { SrcTag } from './shared.jsx';

function Tile({ id, rank }) {
  const { openWork } = useApp();
  const w = byId[id];
  const open = (e) => {
    if (e.target.closest('.srctag')) return;
    openWork(id);
  };
  return (
    <div
      className="tile"
      data-id={id}
      tabIndex={0}
      role="button"
      aria-label={`Sæti ${rank}: ${w.artist}, ${w.title}`}
      onClick={(e) => {
        if (Date.now() - Tile.draggedAt > 250) open(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target === e.currentTarget) openWork(id);
      }}
    >
      <span className="rk">{rank}</span>
      <div className="pic"><img src={`thumbs/${id}.jpg`} alt="" loading="lazy" draggable="false" /></div>
      <div className="cap">
        {w.artist}
        <span className="t">{w.title}</span>
        <span className="pr num">{shortPrice(w)}</span>
        <SrcTag work={w} />
      </div>
    </div>
  );
}
Tile.draggedAt = 0;

export default function Board() {
  const { state, apply } = useApp();
  const root = useRef(null);
  const showNone = state.tiers.none.length > 0;
  const shown = TIERS.filter(([t]) => t !== 'none' || showNone);

  useEffect(() => {
    const list = [...root.current.querySelectorAll('.grid')].map(
      (grid) =>
        new Sortable(grid, {
          group: 'tiers',
          animation: 140,
          draggable: '.tile',
          filter: '.srctag',
          preventOnFilter: false,
          forceFallback: true,
          fallbackTolerance: 5,
          delay: 220,
          delayOnTouchOnly: true,
          touchStartThreshold: 6,
          ghostClass: 'sortable-ghost',
          dragClass: 'sortable-drag',
          scrollSensitivity: 70,
          scrollSpeed: 14,
          bubbleScroll: true,
          onEnd(evt) {
            const { from, to, item, oldIndex, oldDraggableIndex, newDraggableIndex } = evt;
            Tile.draggedAt = Date.now();
            // Put the DOM back so React stays in charge, then apply the move to the state.
            item.remove();
            from.insertBefore(item, from.children[oldIndex] || null);
            if (from === to && oldDraggableIndex === newDraggableIndex) return;
            apply((s) => {
              const [id] = s.tiers[from.dataset.tier].splice(oldDraggableIndex, 1);
              s.tiers[to.dataset.tier].splice(newDraggableIndex, 0, id);
            });
          },
        }),
    );
    return () => list.forEach((s) => s.destroy());
  }, [apply, showNone]);

  let rank = 0;
  return (
    <div ref={root}>
      <div className="head">
        <h2>Raðaðu frá besta til versta</h2>
        <p>Dragðu verk milli flokka og í rétta röð. Á síma heldurðu fingri á verkinu augnablik áður en þú dregur. Smelltu á verk til að skoða það.</p>
      </div>
      {shown.map(([t, n]) => {
        const ids = state.tiers[t];
        return (
          <section className="tier" key={t}>
            <h3 className="tierh"><span className={`dot ${t}`}></span>{n} <small className="num">{ids.length} verk</small></h3>
            <div className="grid" data-tier={t}>
              {ids.length ? ids.map((id) => <Tile key={id} id={id} rank={++rank} />) : <p className="empty">Dragðu verk hingað</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
