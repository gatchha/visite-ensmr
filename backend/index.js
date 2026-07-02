require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const pool = require('./db');
const { authenticate, requireAdmin, estPrincipalOuSuperAdmin } = require('./middleware/auth');
const visitesRouter = require('./routes/visites');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const uploadExcel = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!mimes.includes(file.mimetype)) {
      return cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) sont acceptés'));
    }
    cb(null, true);
  },
});

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use('/api/visites', visitesRouter);

app.post('/api/auth/login/admin', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis' });
  try {
    const result = await pool.query('SELECT * FROM admins WHERE email = $1 AND is_active = true', [email.toLowerCase()]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, departement: admin.departement, filiere: admin.filiere, type: 'admin' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: admin.id, email: admin.email, nom: admin.nom, prenom: admin.prenom, role: admin.role } });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/auth/forgot-password/admin', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requis' });
  try {
    const result = await pool.query('SELECT id, nom, prenom FROM admins WHERE email = $1 AND is_active = true', [email.toLowerCase()]);
    if (result.rows.length === 0) return res.json({ message: 'Si ce compte existe, un email a été envoyé.' });
    const admin = result.rows[0];
    const token = require('crypto').randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    await pool.query('UPDATE admins SET reset_token = $1, reset_token_expires = $2 WHERE id = $3', [token, expires, admin.id]);
    const resetUrl = `${process.env.FRONTEND_URL}/admins/reset-password/${token}`;
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Réinitialisation de mot de passe',
      html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe : <a href="${resetUrl}">${resetUrl}</a></p><p>Ce lien expire dans 1 heure.</p>`,
    });
    res.json({ message: 'Si ce compte existe, un email a été envoyé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/auth/reset-password/admin', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Token et mot de passe requis' });
  if (password.length < 8) return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
  try {
    const result = await pool.query(
      'SELECT id FROM admins WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    if (result.rows.length === 0) return res.status(400).json({ message: 'Token invalide ou expiré' });
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE admins SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2', [hash, result.rows[0].id]);
    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/admin/profil', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, nom, prenom, role, departement, filiere FROM admins WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Compte introuvable' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/admin/profil/password', authenticate, requireAdmin, async (req, res) => {
  const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;
  if (!ancien_mot_de_passe || !nouveau_mot_de_passe) return res.status(400).json({ message: 'Champs requis' });
  if (nouveau_mot_de_passe.length < 8) return res.status(400).json({ message: 'Minimum 8 caractères' });
  try {
    const result = await pool.query('SELECT password_hash FROM admins WHERE id = $1', [req.user.id]);
    const isValid = await bcrypt.compare(ancien_mot_de_passe, result.rows[0].password_hash);
    if (!isValid) return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

const MOTS_CLES_EMAIL_IMPORT = ['email', 'e-mail', 'mail', 'adresse', 'courriel', 'institutionnel', 'contact'];

function normaliserTexteImport(t) {
  if (!t) return '';
  return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function detecterNiveauFeuille(nomFeuille) {
  const n = normaliserTexteImport(nomFeuille);
  if (n.includes('1a') || n.includes('1ere') || n.includes('premiere')) return '1A';
  if (n.includes('2a') || n.includes('2eme') || n.includes('deuxieme')) return '2A';
  if (n.includes('3a') || n.includes('3eme') || n.includes('troisieme')) return '3A';
  return null;
}

function detecterAnneeUniversitaireDansClasseur(workbook) {
  const motif = /(20\d{2})\s*[-/]\s*(20\d{2})/;
  for (const nomFeuille of workbook.SheetNames) {
    const lignes = XLSX.utils.sheet_to_json(workbook.Sheets[nomFeuille], { header: 1, defval: '' });
    for (const ligne of lignes) {
      for (const cellule of ligne) {
        const correspondance = String(cellule).match(motif);
        if (correspondance) return `${correspondance[1]}-${correspondance[2]}`;
      }
    }
  }
  return null;
}

function lireFeuille(worksheet) {
  const dataRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: false });
  let indexEntete = -1;
  for (let i = 0; i < Math.min(20, dataRaw.length); i++) {
    const rowStr = dataRaw[i].map(c => String(c).toUpperCase()).join('');
    if (rowStr.includes('EMAIL') || rowStr.includes('E-MAIL') || rowStr.includes('NOM') || rowStr.includes('MATRICULE')) {
      indexEntete = i; break;
    }
  }
  if (indexEntete === -1) return null;
  const entete = dataRaw[indexEntete].map(c => String(c).trim());
  const colEmail = entete.find(col => MOTS_CLES_EMAIL_IMPORT.some(k => normaliserTexteImport(col).includes(k)));
  if (!colEmail) return null;
  const colNom = entete.find(col => normaliserTexteImport(col) === 'nom');
  const colPrenom = entete.find(col => normaliserTexteImport(col) === 'prenom');
  const colMatricule = entete.find(col => normaliserTexteImport(col).includes('matricule'));
  const colClasse = entete.find(col => normaliserTexteImport(col).includes('classe'));
  const donnees = dataRaw.slice(indexEntete + 1)
    .map(row => { const o = {}; entete.forEach((h, i) => { if (h) o[h] = row[i] || ''; }); return o; })
    .filter(o => Object.values(o).some(v => v !== ''));
  return { colEmail, colNom, colPrenom, colMatricule, colClasse, donnees };
}

app.post('/api/admin/import-eligibles', authenticate, requireAdmin, uploadExcel.single('fichier'), async (req, res) => {
  if (!estPrincipalOuSuperAdmin(req.user)) {
    return res.status(403).json({ message: 'Accès réservé au compte principal' });
  }
  if (!req.file) return res.status(400).json({ message: 'Fichier Excel requis' });

  const stats = { inseres: 0, mis_a_jour: 0, ignores: 0, erreurs: [] };

  try {
    const workbook = XLSX.readFile(req.file.path);
    const anneeManuelle = (req.body.annee || '').trim();
    const annee = /^20\d{2}-20\d{2}$/.test(anneeManuelle)
      ? anneeManuelle
      : (detecterAnneeUniversitaireDansClasseur(workbook) || (() => {
          const now = new Date(); const y = now.getFullYear();
          return now.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
        })());

    await pool.query('UPDATE etudiants_eligibles SET actif = false WHERE annee_universitaire < $1', [annee]);

    for (const nomFeuille of workbook.SheetNames) {
      const niveau = detecterNiveauFeuille(nomFeuille);
      if (!niveau) continue;
      const feuille = lireFeuille(workbook.Sheets[nomFeuille]);
      if (!feuille) { stats.erreurs.push(`Feuille "${nomFeuille}": colonne email non trouvée`); continue; }

      const dateFinGrace = niveau === '3A' ? `${annee.split('-')[1]}-11-30` : null;

      for (const row of feuille.donnees) {
        let email = String(row[feuille.colEmail] || '').replace(/\s+/g, '').toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { stats.ignores++; continue; }

        const nom = feuille.colNom ? String(row[feuille.colNom] || '').trim() || null : null;
        const prenom = feuille.colPrenom ? String(row[feuille.colPrenom] || '').trim() || null : null;
        const matricule = feuille.colMatricule ? String(row[feuille.colMatricule] || '').trim() || null : null;
        const valClasse = feuille.colClasse ? String(row[feuille.colClasse] || '').trim() : '';
        const nomFiliere = valClasse ? valClasse.replace(/\s*\d{2,4}\s*[-/]\s*\d{2,4}\s*$/, '').replace(/\s+/g, ' ').trim() || null : null;

        try {
          const result = await pool.query(
            `INSERT INTO etudiants_eligibles (email, annee_universitaire, niveau, nom, prenom, matricule, nom_filiere_nettoye, date_fin_grace, actif, est_email_enim)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
             ON CONFLICT (email, annee_universitaire) DO UPDATE SET actif = true, niveau = EXCLUDED.niveau, nom = EXCLUDED.nom, prenom = EXCLUDED.prenom, matricule = EXCLUDED.matricule, nom_filiere_nettoye = EXCLUDED.nom_filiere_nettoye
             RETURNING (xmax = 0) AS inserted`,
            [email, annee, niveau, nom, prenom, matricule, nomFiliere, dateFinGrace, email.endsWith('@enim.ac.ma')]
          );
          if (result.rows[0].inserted) stats.inseres++;
          else stats.mis_a_jour++;
        } catch { stats.ignores++; }
      }
    }

    require('fs').unlinkSync(req.file.path);
    res.json({ message: `Import terminé pour l'année ${annee}`, annee, stats });
  } catch (error) {
    if (req.file) try { require('fs').unlinkSync(req.file.path); } catch {}
    res.status(500).json({ message: 'Erreur lors du traitement du fichier', error: error.message });
  }
});

app.get('/api/admin/eligibles/stats', authenticate, requireAdmin, async (req, res) => {
  if (!estPrincipalOuSuperAdmin(req.user)) return res.status(403).json({ message: 'Accès réservé au compte principal' });
  try {
    const result = await pool.query(`
      SELECT annee_universitaire, niveau, COUNT(*) AS total
      FROM etudiants_eligibles WHERE actif = true
      GROUP BY annee_universitaire, niveau
      ORDER BY annee_universitaire DESC, niveau
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Serveur visites démarré sur le port ${PORT}`));
