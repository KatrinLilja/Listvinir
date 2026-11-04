import { WORKS, byId, flat, metaLine, priceText, tierName, tierOf, title } from './ranking.js';

const stamp = () => {
  const d = new Date();
  const months = ['janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const asText = (s) =>
  flat(s)
    .map((id, i) => {
      const w = byId[id];
      return `${i + 1}. ${w.artist} – ${title(w)} (nr. ${w.id})`;
    })
    .join('\n');

function saveFile(filename, data, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

export async function exportXlsx(s) {
  const XLSX = await import('xlsx');
  const rows = flat(s).map((id, i) => {
    const w = byId[id];
    return [i + 1, tierName[tierOf(s, id)], w.id, w.artist, w.title, w.year, w.medium, w.size, w.edition, w.low, w.high, w.conf, w.basis];
  });
  const ws = XLSX.utils.aoa_to_sheet([
    ['Sæti', 'Flokkur', 'Nr.', 'Listamaður', 'Verk', 'Ár', 'Efni og tækni', 'Stærð', 'Upplag', 'Áætlað verð, lágt (kr.)', 'Áætlað verð, hátt (kr.)', 'Öryggi', 'Forsendur'],
    ...rows,
  ]);
  ws['!cols'] = [6, 11, 5, 34, 38, 12, 44, 24, 18, 14, 14, 10, 80].map((wch) => ({ wch }));
  ws['!autofilter'] = { ref: `A1:M${WORKS.length + 1}` };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Röðun');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  saveFile('haustrodun-2026.xlsx', buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

const pdfSafe = (s) => String(s).replace(/[“”„]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, '-');
async function imgData(id) {
  const b = await (await fetch(`thumbs/${id}.jpg`)).blob();
  const url = await new Promise((r) => {
    const f = new FileReader();
    f.onload = () => r(f.result);
    f.readAsDataURL(b);
  });
  const im = await new Promise((ok, no) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = no;
    i.src = url;
  });
  return { url, w: im.naturalWidth, h: im.naturalHeight };
}

export async function exportPdf(s) {
  const { jsPDF } = await import('jspdf');
  const ids = flat(s);
  const imgs = await Promise.all(ids.map(imgData));
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 16, rowH = 23, th = 19;
  doc.setProperties({ title: 'Hauströðun 2026' });
  let y = M;
  let last = null;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(pdfSafe('Hauströðun 2026'), M, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(pdfSafe(`Frá besta til versta · ${stamp()}`), M, y + 12);
  doc.setTextColor(0);
  y += 20;
  ids.forEach((id, i) => {
    const w = byId[id];
    const t = tierOf(s, id);
    const head = t !== last;
    if (y + rowH + (head ? 9 : 0) > H - M) {
      doc.addPage();
      y = M;
    }
    if (head) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(pdfSafe(tierName[t]), M, y + 4);
      doc.setDrawColor(20);
      doc.line(M, y + 6, W - M, y + 6);
      y += 9;
      last = t;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(String(i + 1), M + 10, y + 11, { align: 'right' });
    const im = imgs[i];
    const sc = Math.min(th / im.w, th / im.h);
    const iw = im.w * sc;
    const ih = im.h * sc;
    doc.addImage(im.url, 'JPEG', M + 14 + (th - iw) / 2, y + 1 + (th - ih) / 2, iw, ih);
    const x = M + 37;
    const tw = W - M - x;
    doc.setFontSize(10.5);
    doc.text(doc.splitTextToSize(pdfSafe(w.artist), tw)[0], x, y + 7);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10.5);
    doc.text(doc.splitTextToSize(pdfSafe(title(w)), tw)[0], x, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90);
    doc.text(doc.splitTextToSize(pdfSafe(`Nr. ${w.id} · ${metaLine(w)}`), tw)[0], x, y + 16.5);
    doc.text(pdfSafe(`Áætlað verð: ${priceText(w)}`), x, y + 20.5);
    doc.setTextColor(0);
    y += rowH;
  });
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90);
    doc.text(`${p} / ${pages}`, W - M, H - 8, { align: 'right' });
  }
  saveFile('haustrodun-2026.pdf', doc.output('arraybuffer'), 'application/pdf');
}

const tierKey = { ...Object.fromEntries(Object.entries(tierName).map(([k, n]) => [n, k])), Elska: 'love', 'Líkar vel': 'like', Sleppa: 'pass' };

export async function parseList(file) {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('format');
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
  const h = rows.findIndex((r) => r.includes('Sæti') && r.includes('Nr.'));
  if (h < 0) throw new Error('format');
  const cS = rows[h].indexOf('Sæti');
  const cN = rows[h].indexOf('Nr.');
  const cF = rows[h].indexOf('Flokkur');
  const seen = new Set();
  const items = [];
  for (const r of rows.slice(h + 1)) {
    const rank = Number(r[cS]);
    const id = String(r[cN] == null ? '' : r[cN]).trim().padStart(2, '0');
    if (byId[id] && rank > 0 && !seen.has(id)) {
      seen.add(id);
      items.push({ rank, id, t: cF < 0 ? null : tierKey[r[cF]] });
    }
  }
  if (!items.length) throw new Error('format');
  items.sort((a, b) => a.rank - b.rank);
  const tier = {};
  items.forEach((x) => {
    if (x.t && x.t !== 'none') tier[x.id] = x.t;
  });
  return {
    order: [...items.map((x) => x.id), ...WORKS.filter((w) => !seen.has(w.id)).map((w) => w.id)],
    tier,
    missing: WORKS.length - items.length,
  };
}
