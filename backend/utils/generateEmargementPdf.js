const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getSceauBase64() {
    const sceauPath = path.join(__dirname, '..', 'assets', 'sceau.png');
    if (!fs.existsSync(sceauPath)) return null;
    const buffer = fs.readFileSync(sceauPath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function generateEmargementPdf(totalEtudiants, visite, nomFiliere, dateFormatee, niveauLabel) {
    const sceauSrc = getSceauBase64();
    const dateRabat = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    const lignes = Array.from({ length: totalEtudiants }, (_, i) => `
        <tr>
            <td>${i + 1}</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 40px; }
  .header-table { width: 100%; margin-bottom: 20px; }
  .header-table td { vertical-align: top; }
  .title-cell { text-align: center; }
  .title-cell .ecole { font-size: 13px; font-weight: bold; }
  .title-cell .dept { font-size: 11px; margin-top: 4px; }
  .date-cell { text-align: right; font-size: 11px; width: 160px; }
  hr { margin: 16px 0; border: none; border-top: 1px solid #ccc; }
  .titre { text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline; margin: 14px 0 10px; }
  .infos { margin-bottom: 16px; line-height: 1.9; font-size: 11px; }
  .infos span { font-weight: bold; }
  table.emargement { width: 100%; border-collapse: collapse; }
  table.emargement th { background-color: #002147; color: white; padding: 7px 8px; border: 1px solid #999; font-size: 11px; text-align: center; }
  table.emargement td { padding: 6px 8px; border: 1px solid #bbb; font-size: 11px; text-align: center; height: 28px; }
  .sceau { position: fixed; bottom: 40px; right: 40px; width: 100px; opacity: 0.8; }
</style>
</head>
<body>

<table class="header-table">
  <tr>
    <td style="width:180px;"></td>
    <td class="title-cell">
      <div class="ecole">ÉCOLE NATIONALE SUPÉRIEURE DES MINES DE RABAT</div>
      <div class="dept">Service des Stages</div>
    </td>
    <td class="date-cell">Rabat, le ${escapeHtml(dateRabat)}</td>
  </tr>
</table>

<hr>

<div class="titre">Feuille d'émargement — Visite d'entreprise</div>

<div class="infos">
  <div>Filière : <span>${escapeHtml(nomFiliere)}</span> &nbsp;|&nbsp; Niveau : <span>${escapeHtml(niveauLabel)}</span></div>
  <div>Date : <span>${escapeHtml(dateFormatee)}</span> &nbsp;|&nbsp; Entreprise : <span>${escapeHtml(visite.entreprise)}</span></div>
  <div>Ville : <span>${escapeHtml(visite.ville)}</span> &nbsp;|&nbsp; Effectif : <span>${totalEtudiants} étudiants</span></div>
</div>

<table class="emargement">
  <thead>
    <tr>
      <th style="width:40px;">N°</th>
      <th style="width:120px;">Matricule</th>
      <th>Nom</th>
      <th>Prénom</th>
      <th style="width:130px;">Émargement</th>
    </tr>
  </thead>
  <tbody>
    ${lignes}
  </tbody>
</table>

${sceauSrc ? `<img class="sceau" src="${sceauSrc}" alt="Sceau officiel">` : ''}

</body>
</html>`;

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: { top: '10mm', bottom: '10mm', left: '0', right: '0' },
            printBackground: true,
        });
        return pdfBuffer;
    } finally {
        await browser.close();
    }
}

module.exports = { generateEmargementPdf };
