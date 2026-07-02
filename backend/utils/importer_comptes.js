require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function lireCsv(chemin) {
  const contenu = fs.readFileSync(chemin, 'utf8');
  const lignes = contenu
    .split(/\r?\n/)
    .filter((ligne) => ligne.trim() !== '' && !ligne.trim().startsWith('#'));

  if (lignes.length === 0) {
    return [];
  }

  const entetes = lignes[0].split(',').map((c) => c.trim());

  return lignes.slice(1).map((ligne) => {
    const valeurs = ligne.split(',');
    const objet = {};
    entetes.forEach((entete, i) => {
      objet[entete] = (valeurs[i] || '').trim();
    });
    return objet;
  });
}

function genererMotDePasse() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const octets = crypto.randomBytes(12);
  let motDePasse = '';
  for (let i = 0; i < octets.length; i++) {
    motDePasse += caracteres[octets[i] % caracteres.length];
  }
  return motDePasse;
}

async function importerFilieres(donnees) {
  for (const ligne of donnees) {
    if (!ligne.nom_departement) continue;
    await pool.query(
      'INSERT INTO departements (nom_departement) VALUES ($1) ON CONFLICT (nom_departement) DO NOTHING',
      [ligne.nom_departement]
    );
  }

  for (const ligne of donnees) {
    if (!ligne.nom_filiere || !ligne.nom_departement) continue;

    const departement = await pool.query(
      'SELECT id FROM departements WHERE nom_departement = $1',
      [ligne.nom_departement]
    );
    if (departement.rows.length === 0) continue;

    const est3a = String(ligne.est_3a).toLowerCase() === 'true';

    await pool.query(
      `INSERT INTO filieres (nom_filiere, est_3a, departement_id, email_1a, email_2a, email_3a)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (nom_filiere, est_3a) DO UPDATE SET
         departement_id = EXCLUDED.departement_id,
         email_1a = EXCLUDED.email_1a,
         email_2a = EXCLUDED.email_2a,
         email_3a = EXCLUDED.email_3a`,
      [
        ligne.nom_filiere,
        est3a,
        departement.rows[0].id,
        ligne.email_1a || null,
        ligne.email_2a || null,
        ligne.email_3a || null,
      ]
    );
  }
}

async function importerAdmins(donnees) {
  const nouveaux = [];

  for (const ligne of donnees) {
    if (!ligne.email) continue;
    const email = ligne.email.toLowerCase();

    const existe = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
    if (existe.rows.length > 0) continue;

    const motDePasse = genererMotDePasse();
    const hash = await bcrypt.hash(motDePasse, 10);

    await pool.query(
      `INSERT INTO admins (email, password_hash, nom, prenom, role, departement, filiere)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        email,
        hash,
        ligne.nom || '',
        ligne.prenom || '',
        ligne.role || 'secondaire',
        ligne.departement || null,
        ligne.filiere || null,
      ]
    );

    nouveaux.push({
      email,
      motDePasse,
      role: ligne.role,
      departement: ligne.departement,
      filiere: ligne.filiere,
    });
  }

  return nouveaux;
}

async function lierChefsDepartement() {
  const chefs = await pool.query(
    `SELECT id, departement FROM admins
     WHERE role = 'secondaire'
       AND departement IS NOT NULL
       AND (filiere IS NULL OR filiere = '')`
  );

  for (const chef of chefs.rows) {
    await pool.query(
      'UPDATE departements SET chef_departement_id = $1 WHERE nom_departement = $2',
      [chef.id, chef.departement]
    );
  }
}

async function main() {
  const cheminFilieres = path.join(__dirname, '..', 'data', 'filieres.csv');
  const cheminAdmins = path.join(__dirname, '..', 'data', 'admins.csv');

  console.log('Import des départements et filières...');
  await importerFilieres(lireCsv(cheminFilieres));

  console.log('Import des comptes administrateurs...');
  const nouveaux = await importerAdmins(lireCsv(cheminAdmins));

  await lierChefsDepartement();

  if (nouveaux.length === 0) {
    console.log('Aucun nouveau compte créé, tous les comptes existent déjà.');
  } else {
    console.log('');
    console.log('Comptes créés. Transmettre ces accès, le mot de passe doit être changé à la première connexion :');
    console.log('');
    for (const compte of nouveaux) {
      let portee = 'service de stage';
      if (compte.filiere) {
        portee = `filière ${compte.filiere}`;
      } else if (compte.departement) {
        portee = `département ${compte.departement}`;
      }
      console.log(`${compte.email}  |  ${compte.motDePasse}  |  ${portee}`);
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Erreur import :', err);
  process.exit(1);
});
