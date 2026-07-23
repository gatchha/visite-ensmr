DROP TABLE IF EXISTS etudiants_eligibles CASCADE;
DROP TABLE IF EXISTS visite_filieres CASCADE;
DROP TABLE IF EXISTS visites CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS filieres CASCADE;
DROP TABLE IF EXISTS departements CASCADE;

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('principal', 'secondaire', 'super_admin')),
    departement VARCHAR(100),
    filiere VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    date_creation TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reset_token TEXT,
    reset_token_expires TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX idx_admins_email ON admins(email);

CREATE TABLE departements (
    id SERIAL PRIMARY KEY,
    nom_departement VARCHAR(100) NOT NULL UNIQUE,
    chef_departement_id INTEGER REFERENCES admins(id)
);

CREATE TABLE filieres (
    id SERIAL PRIMARY KEY,
    nom_filiere VARCHAR(100) NOT NULL,
    est_3a BOOLEAN DEFAULT false,
    departement_id INTEGER NOT NULL REFERENCES departements(id),
    email_1a VARCHAR(150),
    email_2a VARCHAR(150),
    email_3a VARCHAR(150),
    CONSTRAINT unique_filiere_niveau UNIQUE (nom_filiere, est_3a)
);

CREATE TABLE visites (
    id SERIAL PRIMARY KEY,
    niveau VARCHAR(2) NOT NULL CHECK (niveau IN ('1A', '2A', '3A')),
    date_visite DATE NOT NULL,
    entreprise TEXT NOT NULL,
    adresse TEXT NOT NULL,
    ville VARCHAR(100) NOT NULL,
    heure_arrivee TIME NOT NULL,
    heure_depart TIME NOT NULL,
    nb_gr_eleves INTEGER NOT NULL,
    nb_eleves INTEGER NOT NULL,
    mode_transport_eleve TEXT NOT NULL,
    nb_professeurs INTEGER NOT NULL,
    mode_transport_prof TEXT NOT NULL,
    nom_professeur TEXT NOT NULL,
    observations TEXT,
    statut VARCHAR(20) DEFAULT 'en_attente'
);

CREATE INDEX idx_visites_date ON visites(date_visite);
CREATE INDEX idx_visites_niveau ON visites(niveau);

CREATE TABLE visite_filieres (
    visite_id INTEGER NOT NULL REFERENCES visites(id) ON DELETE CASCADE,
    filiere_id INTEGER NOT NULL REFERENCES filieres(id),
    PRIMARY KEY (visite_id, filiere_id)
);

CREATE INDEX idx_visite_filieres_filiere ON visite_filieres(filiere_id);

CREATE TABLE etudiants_eligibles (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    annee_universitaire VARCHAR(9) NOT NULL,
    niveau VARCHAR(2) NOT NULL CHECK (niveau IN ('1A', '2A', '3A')),
    nom VARCHAR(100),
    prenom VARCHAR(100),
    matricule VARCHAR(20),
    nom_filiere_nettoye VARCHAR(100),
    date_fin_grace DATE,
    actif BOOLEAN DEFAULT true,
    date_ajout TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    est_email_enim BOOLEAN DEFAULT true,
    CONSTRAINT unique_email_annee UNIQUE (email, annee_universitaire)
);

CREATE INDEX idx_eligibles_email ON etudiants_eligibles(email);
CREATE INDEX idx_eligibles_annee ON etudiants_eligibles(annee_universitaire);
CREATE INDEX idx_eligibles_filiere ON etudiants_eligibles(niveau, nom_filiere_nettoye);

INSERT INTO departements (nom_departement) VALUES
  ('Génie des Procédés Industriels'),
  ('Génie des Matériaux'),
  ('Mines'),
  ('Informatique'),
  ('Sciences de la Terre'),
  ('Génie Industriel'),
  ('Électromécanique');

INSERT INTO filieres (nom_filiere, est_3a, departement_id, email_1a, email_2a, email_3a) VALUES
  ('Génie de l''Energie et des Procédés Industriels', false, (SELECT id FROM departements WHERE nom_departement='Génie des Procédés Industriels'), 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Génie des Matériaux et de Mécanique',            false, (SELECT id FROM departements WHERE nom_departement='Génie des Matériaux'),            'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Génie des Mines et de l''Environnement',         false, (SELECT id FROM departements WHERE nom_departement='Mines'),                           'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Ingénierie des Systèmes d''Information et de Production', false, (SELECT id FROM departements WHERE nom_departement='Informatique'),           'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Génie Civil et Minier',                          false, (SELECT id FROM departements WHERE nom_departement='Sciences de la Terre'),            'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Génie Industriel',                               false, (SELECT id FROM departements WHERE nom_departement='Génie Industriel'),                'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Génie Electromécanique',                         false, (SELECT id FROM departements WHERE nom_departement='Électromécanique'),                'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Aménagement et Exploitation des Sols et Sous Sols', true, (SELECT id FROM departements WHERE nom_departement='Mines'),                        'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Efficacité Energétique et Intégration des Energies', true, (SELECT id FROM departements WHERE nom_departement='Électromécanique'),            'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Electromécanique',                               true,  (SELECT id FROM departements WHERE nom_departement='Électromécanique'),                'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Environnement et Sécurité Industriels',          true,  (SELECT id FROM departements WHERE nom_departement='Mines'),                           'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Génie Civil et Minier',                          true,  (SELECT id FROM departements WHERE nom_departement='Sciences de la Terre'),            'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Génie Energétique',                              true,  (SELECT id FROM departements WHERE nom_departement='Génie des Procédés Industriels'), 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Ingénierie des Procédés Industriels',            true,  (SELECT id FROM departements WHERE nom_departement='Génie des Procédés Industriels'), 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Matériaux et Contrôle Qualité',                  true,  (SELECT id FROM departements WHERE nom_departement='Génie des Matériaux'),            'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Maintenance Industrielle',                       true,  (SELECT id FROM departements WHERE nom_departement='Électromécanique'),                'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Génie Productique',                              true,  (SELECT id FROM departements WHERE nom_departement='Informatique'),                    'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Génie Informatique',                             true,  (SELECT id FROM departements WHERE nom_departement='Informatique'),                    'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Génie Industriel',                               true,  (SELECT id FROM departements WHERE nom_departement='Génie Industriel'),                'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Ingénierie des Données',                         true,  (SELECT id FROM departements WHERE nom_departement='Informatique'),                    'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma'),
  ('Management Industriel',                          true,  (SELECT id FROM departements WHERE nom_departement='Génie Industriel'),                'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma', 'test-stage@enim.ac.ma');
