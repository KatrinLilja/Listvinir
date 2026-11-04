import { useApp } from '../context.js';
import { WORKS, priceText, shortPrice } from '../lib/ranking.js';
import { SourceLinks } from './shared.jsx';

export default function Sources() {
  const { openWork } = useApp();
  const has = WORKS.filter((w) => w.src);
  const none = WORKS.filter((w) => !w.src);
  return (
    <>
      <div className="head">
        <h2>Heimildir</h2>
        <p>Verð voru skoðuð 4. nóvember 2026. Heimildirnar sýna viðmið. Bilið á hverju verki er gróf áætlun út frá þeim.</p>
      </div>
      <section className="srcsec">
        <h3 className="tierh">Verk með verðheimild <small className="num">{has.length} verk</small></h3>
        <ul className="srcs">
          {has.map((w) => (
            <li key={w.id}>
              <button className="srcwork" onClick={() => openWork(w.id)}>
                <img src={`thumbs/${w.id}.jpg`} alt="" loading="lazy" />
                <span>
                  <span className="n num">{w.id}</span> <b>{w.artist}</b>
                  <span className="t">{w.title}</span>
                  <span className="pr num">{priceText(w)}</span>
                </span>
              </button>
              <SourceLinks work={w} />
            </li>
          ))}
        </ul>
      </section>
      <section className="srcsec">
        <h3 className="tierh">Verk án verðheimildar <small className="num">{none.length} verk</small></h3>
        <p className="hint">Engin verð fundust fyrir þessi verk eða listamenn. Áætlunin er eingöngu gróft mat út frá stærð, tækni, upplagi og stöðu listamanns.</p>
        <ul className="nosrc">
          {none.map((w) => (
            <li key={w.id}>
              <button onClick={() => openWork(w.id)}>
                <span className="n num">{w.id}</span> {w.artist}, <span className="t">{w.title}</span> <span className="pr num">{shortPrice(w)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="srcsec">
        <h3 className="tierh">Aðrar heimildir</h3>
        <p className="plain">Gengi: <a href="https://wise.com/us/currency-converter/eur-to-isk-rate" target="_blank" rel="noopener noreferrer">Wise</a>, 1 evra = 136,4 kr. Dagsetning gengisins kom ekki fram. Gengi punds, dollars og fleiri mynta var aðeins gróflega áætlað.</p>
        <p className="plain">Ekki tókst að lesa <a href="https://www.myndlist.is/auction/AuctionResult.aspx" target="_blank" rel="noopener noreferrer">uppboðsniðurstöður Gallerís Foldar</a>. Listval, Listheimar og Listaverk leyfa ekki sjálfvirkan lestur á sölulistum sínum, og fréttir mbl.is um uppboð opnuðust ekki.</p>
      </section>
    </>
  );
}
