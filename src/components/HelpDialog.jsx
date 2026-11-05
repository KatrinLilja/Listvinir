import { useModal } from './useModal.js';

export default function HelpDialog({ open, onClose }) {
  const ref = useModal(open);
  return (
    <dialog ref={ref} aria-label="Leiðbeiningar" style={{ width: 'min(640px, calc(100vw - 24px))' }} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open && (
        <>
          <button className="close" onClick={onClose}>Loka</button>
          <div className="sharepop" style={{ lineHeight: 1.45 }}>
            <h3 className="tierh">Leiðbeiningar</h3>
            <p>Listvinir hjálpar þér að raða verkunum 43 svo þú vitir hvaða verk þú velur þegar röðin kemur að þér. Allt vistast í þínum eigin vafra. Engin innskráning er og enginn annar sér listann þinn.</p>

            <p><b>1. Flokka</b><br />Þú sérð eitt verk í einu og setur hvert þeirra í flokk: Flokkur 1 langar mest í, Flokkur 2 væri til í, Flokkur 3 kannski, Flokkur 4 vil ekki. Á lyklaborði velja takkarnir 1–4 flokk og örvarnar færa þig á milli verka.</p>

            <p><b>2. Raða</b><br />Sýnir alla flokkana. Dragðu verk til að breyta röðinni eða færa þau á milli flokka.</p>

            <p><b>3. Einvígi</b><br />Valfrjálst. Veldu flokk og veldu svo betra verkið af tveimur þar til flokkurinn er kominn í röð. Á lyklaborði velja ← og → hlið og ↓ þýðir „get ekki valið“. „Til baka“ afturkallar síðasta val.</p>

            <p><b>4. Listinn</b><br />Lokalistinn þinn í röð, með áætluðu verði. Hér getur þú afritað hann sem texta, sótt PDF til að prenta eða sótt Excel-skjal.</p>

            <p><b>5. Umboð</b><br />Ef þú velur fyrir hönd þeirra sem komast ekki: viðkomandi býr til sinn lista og sendir þér Excel-skjalið af flipanum Listinn. Þú skrifar nafnið og hleður skjalinu upp. Meðan valið fer fram smellirðu á verkin sem aðrir taka, og þá sýnir hver listi næsta lausa verk viðkomandi.</p>

            <p><b>6. Heimildir</b><br />Hvaðan verðmatið kemur.</p>

            <p><b>Að flytja listann í annað tæki</b><br />Smelltu á Flytja lista. Skannaðu svo QR-kóðann með símanum eða opnaðu hlekkinn í hinu tækinu.</p>

            <p className="hint">Listinn er aðeins geymdur í þessum vafra. Ef þú hreinsar vafragögnin eða notar huliðsglugga hverfur listinn, svo sæktu Excel-skjalið sem öryggisafrit. Verðin eru gróf áætlun, ekki formlegt verðmat.</p>
          </div>
        </>
      )}
    </dialog>
  );
}
