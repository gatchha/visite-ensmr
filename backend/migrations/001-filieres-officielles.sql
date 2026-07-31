-- Migration 001 : alignement des filieres sur la liste officielle
-- A jouer une fois, APRES avoir importe le fichier Excel des filieres.
--
--   sudo docker exec -i visite-ensmr-postgres-1 psql -U <utilisateur> -d <base> \
--     < backend/migrations/001-filieres-officielles.sql
--
-- L'import Excel met a jour les filieres presentes dans le fichier, mais ne
-- supprime pas celles qui n'y figurent plus. Cette migration s'en charge.

BEGIN;

-- 1. Effacer les adresses de 2eme annee posees a tort sur les filieres de
--    specialite. Les 2eme annee suivent le tronc commun.
UPDATE filieres SET email_2a = NULL WHERE est_3a = true;

-- 2. Effacer les adresses de 1ere annee posees a tort sur les specialites.
UPDATE filieres SET email_1a = NULL WHERE est_3a = true;

-- 3. Effacer les adresses de 3eme annee sur le tronc commun.
UPDATE filieres SET email_3a = NULL WHERE est_3a = false;

-- 4. Supprimer les filieres de specialite absentes de la liste officielle,
--    uniquement si aucune visite ne les reference.
DELETE FROM filieres f
WHERE f.est_3a = true
  AND f.nom_filiere IN ('Génie Informatique', 'Génie Industriel')
  AND NOT EXISTS (SELECT 1 FROM visite_filieres vf WHERE vf.filiere_id = f.id);

COMMIT;

-- Verification : aucune ligne ne doit ressortir avec une adresse manquante
-- pour un niveau que la filiere est susceptible de recevoir.
SELECT nom_filiere, est_3a, email_1a, email_2a, email_3a
FROM filieres
WHERE (est_3a = false AND (email_1a IS NULL OR email_2a IS NULL))
   OR (est_3a = true AND email_3a IS NULL)
ORDER BY est_3a, nom_filiere;
