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

function getLogoBase64() {
    const logoPath = path.join(__dirname, '..', 'assets', 'logo-ENIM.png');
    if (!fs.existsSync(logoPath)) return null;
    const buffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function generateNoticePdf(visite, nomFiliere, dateFormatee, dateRabat, niveauLabel) {
    const formatHeure = (h) => h ? String(h).slice(0, 5) : '';
    const sceauSrc = getSceauBase64();
    const logoSrc = getLogoBase64();

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 40px; position: relative; }
  .header-table { width: 100%; margin-bottom: 30px; }
  .header-table td { vertical-align: top; }
  .logo-cell { width: 180px; }
  .logo-cell img { width: 160px; }
  .sceau { position: absolute; bottom: 60px; right: 50px; width: 110px; opacity: 0.85; }
  .title-cell { text-align: center; }
  .title-cell .ecole { font-size: 13px; font-weight: bold; }
  .title-cell .dept { font-size: 11px; margin-top: 4px; }
  .date-cell { text-align: right; font-size: 11px; width: 160px; }
  .titre { text-align: center; margin: 20px 0 4px; font-size: 13px; font-weight: bold; text-decoration: underline; }
  .sous-titre { text-align: center; font-size: 12px; margin-bottom: 20px; }
  .intro { margin-bottom: 14px; line-height: 1.5; }
  table.visite { width: 100%; border-collapse: collapse; margin: 14px 0 20px; }
  table.visite th { background-color: #002147; color: white; padding: 7px 8px; border: 1px solid #999; font-size: 11px; }
  table.visite td { padding: 7px 8px; border: 1px solid #999; text-align: center; font-size: 11px; }
  table.visite td.left { text-align: left; }
  .consignes { margin: 14px 0; line-height: 1.7; }
  .consignes li { margin-left: 20px; }
  .obligatoire { margin-top: 10px; font-weight: bold; }
  .observations { margin-top: 10px; font-style: italic; }
  .signature { margin-top: 40px; font-size: 11px; line-height: 1.8; }
  .signature strong { display: block; margin-bottom: 4px; }
  hr { margin: 24px 0; border: none; border-top: 1px solid #ccc; }
</style>
</head>
<body>

<table class="header-table">
  <tr>
    <td class="logo-cell">${logoSrc ? `<img src="${logoSrc}" alt="Logo ENIM">` : ''}</td>
    <td class="title-cell">
      <div class="ecole">ÉCOLE NATIONALE SUPÉRIEURE DES MINES DE RABAT</div>
      <div class="dept">Service des Stages</div>
    </td>
    <td class="date-cell">Rabat, le ${escapeHtml(dateRabat)}</td>
  </tr>
</table>

<hr>

<div class="titre">Note aux élèves ingénieurs de ${escapeHtml(niveauLabel)}</div>
<div class="sous-titre">Visites prévues le ${escapeHtml(dateFormatee)}</div>

<p class="intro">
  Les élèves Ingénieurs de <strong>${escapeHtml(niveauLabel)}</strong> sont informés
  que le programme des visites, pour le <strong>${escapeHtml(dateFormatee)}</strong>, est ainsi :
</p>

<table class="visite">
  <thead>
    <tr>
      <th>Niveau</th>
      <th>Filière</th>
      <th>Destination</th>
      <th>Départ</th>
      <th>Société</th>
      <th>Nb Étudiants</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${escapeHtml(visite.niveau)}</td>
      <td class="left">${escapeHtml(nomFiliere)}</td>
      <td>${escapeHtml(visite.ville)}</td>
      <td>${escapeHtml(formatHeure(visite.heure_arrivee))}</td>
      <td class="left">${escapeHtml(visite.entreprise)}</td>
      <td>${escapeHtml(String(visite.nb_eleves))}</td>
    </tr>
  </tbody>
</table>

<p class="intro">Chaque étudiant est appelé à :</p>
<ul class="consignes">
  <li>Être muni de sa Carte d'Identité Nationale <strong>« Obligatoire »</strong>, stylo et bloc-notes ;</li>
  <li>Porter une tenue respectable et digne d'un élève ingénieur ;</li>
  <li>Respecter les consignes éventuelles données par l'animateur de l'organisme d'accueil ;</li>
  <li>Prendre connaissance que les prises de photos par appareil photo et téléphone portable sont
      <strong>strictement interdites</strong> au niveau de l'usine sauf autorisation de l'organisme d'accueil.</li>
</ul>

<p class="obligatoire">Nb : La présence est obligatoire</p>

${visite.observations ? `<p class="observations">Observations : ${escapeHtml(visite.observations)}</p>` : ''}

<div class="signature">
  <strong>Chef de Service des stages</strong>
  +212 661 044 967<br>
  stage@enim.ac.ma<br>
  CVthèque : https://cvtheque.enim.ac.ma/<br>
  Formulaire de dépôt des offres de stages : https://forms.gle/jjzsdUfKyCzDxJE9A
</div>

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
            margin: { top: '0', bottom: '0', left: '0', right: '0' },
            printBackground: true,
        });
        return pdfBuffer;
    } finally {
        await browser.close();
    }
}

module.exports = { generateNoticePdf };
