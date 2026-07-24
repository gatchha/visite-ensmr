const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireAdmin, estPrincipalOuSuperAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/sendEmail');
const { generateNoticePdf } = require('../utils/generateNoticePdf');
const { generateEmargementPdf } = require('../utils/generateEmargementPdf');

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const NIVEAUX_VALIDES = ['1A', '2A', '3A'];
const TRANSPORTS_ELEVE = ['Ecole', 'Prestataire'];
const TRANSPORTS_PROF = ['Service', 'Personnel'];

function validerChampsVisite(body) {
    const { niveau, date_visite, entreprise, adresse, ville,
        heure_arrivee, heure_depart, nb_gr_eleves, nb_eleves,
        nb_professeurs, mode_transport_eleve, mode_transport_prof, nom_professeur } = body;

    if (!NIVEAUX_VALIDES.includes(niveau))
        return 'Niveau invalide.';
    if (!date_visite || isNaN(new Date(date_visite)))
        return 'Date invalide.';
    if (!entreprise || entreprise.trim().length < 2 || entreprise.length > 200)
        return 'Nom d\'entreprise invalide (2-200 caractères).';
    if (!adresse || adresse.trim().length < 2 || adresse.length > 300)
        return 'Adresse invalide.';
    if (!ville || ville.trim().length < 2 || ville.length > 100)
        return 'Ville invalide.';
    if (!heure_arrivee || !/^\d{2}:\d{2}$/.test(heure_arrivee))
        return 'Heure d\'arrivée invalide.';
    if (!heure_depart || !/^\d{2}:\d{2}$/.test(heure_depart))
        return 'Heure de départ invalide.';
    if (!Number.isInteger(Number(nb_gr_eleves)) || Number(nb_gr_eleves) < 1 || Number(nb_gr_eleves) > 50)
        return 'Nombre de groupes invalide (1-50).';
    if (!Number.isInteger(Number(nb_eleves)) || Number(nb_eleves) < 1 || Number(nb_eleves) > 1000)
        return 'Nombre d\'élèves invalide (1-1000).';
    if (!Number.isInteger(Number(nb_professeurs)) || Number(nb_professeurs) < 1 || Number(nb_professeurs) > 50)
        return 'Nombre de professeurs invalide (1-50).';
    const valsEleve = (mode_transport_eleve || '').split(',').map(v => v.trim()).filter(Boolean);
    if (valsEleve.length === 0 || !valsEleve.every(v => TRANSPORTS_ELEVE.includes(v)))
        return 'Mode de transport élèves invalide.';
    const valsProf = (mode_transport_prof || '').split(',').map(v => v.trim()).filter(Boolean);
    if (valsProf.length === 0 || !valsProf.every(v => TRANSPORTS_PROF.includes(v)))
        return 'Mode de transport professeurs invalide.';
    if (!nom_professeur || nom_professeur.trim().length < 2 || nom_professeur.length > 200)
        return 'Nom du professeur invalide.';
    return null;
}

router.post('/', authenticate, requireAdmin, async (req, res) => {
    const {
        niveau, date_visite, entreprise, adresse, ville,
        heure_arrivee, heure_depart, nb_gr_eleves, nb_eleves,
        mode_transport_eleve, nb_professeurs, mode_transport_prof,
        nom_professeur, observations, filieres
    } = req.body;

    const erreur = validerChampsVisite(req.body);
    if (erreur) return res.status(400).json({ message: erreur });

    if (!Array.isArray(filieres) || filieres.length === 0) {
        return res.status(400).json({ message: 'Au moins une filière doit être sélectionnée.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const queryVisite = `
            INSERT INTO visites
                (niveau, date_visite, entreprise, adresse, ville,
                 heure_arrivee, heure_depart, nb_gr_eleves, nb_eleves,
                 mode_transport_eleve, nb_professeurs, mode_transport_prof,
                 nom_professeur, observations, statut)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'en_attente')
            RETURNING id
        `;
        const resVisite = await client.query(queryVisite, [
            niveau, date_visite, entreprise, adresse, ville,
            heure_arrivee, heure_depart, nb_gr_eleves, nb_eleves,
            mode_transport_eleve, nb_professeurs, mode_transport_prof,
            nom_professeur, observations
        ]);

        const visiteId = resVisite.rows[0].id;

        const queryLiaison = 'INSERT INTO visite_filieres (visite_id, filiere_id) VALUES ($1, $2)';
        for (const id_filiere of filieres) {
            await client.query(queryLiaison, [visiteId, id_filiere]);
        }

        await client.query('COMMIT');

        const destStage = process.env.SERVICE_STAGE_EMAIL || 'stage@enim.ac.ma';
        const dateFormatee = new Date(date_visite).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        const createur = req.user ? `${req.user.prenom || ''} ${req.user.nom || ''}`.trim() : 'Un chef de département';
        try {
            await sendEmail(
                destStage,
                `Nouvelle visite planifiée — ${entreprise} (${niveau}) — ${dateFormatee}`,
                `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                  <h2 style="color:#002147;">Nouvelle visite d'entreprise planifiée</h2>
                  <div style="background:#f8f9fa;padding:15px;border-radius:5px;border-left:4px solid #002147;margin:20px 0;">
                    <p><strong>Entreprise :</strong> ${escapeHtml(entreprise)}</p>
                    <p><strong>Ville :</strong> ${escapeHtml(ville)}</p>
                    <p><strong>Date :</strong> ${dateFormatee}</p>
                    <p><strong>Niveau :</strong> ${escapeHtml(niveau)}</p>
                    <p><strong>Nombre d'élèves :</strong> ${nb_eleves}</p>
                    <p><strong>Planifiée par :</strong> ${escapeHtml(createur)}</p>
                  </div>
                  <p>Connectez-vous à la plateforme visite-ensmr pour valider cette visite.</p>
                  <p style="color:#6c757d;font-size:12px;">Service des Stages — ENSMR</p>
                </div>`
            );
        } catch (emailError) {
            console.warn('Erreur envoi email notification visite :', emailError.message);
        }

        res.status(201).json({ message: 'Visite créée avec succès', id: visiteId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la création de la visite :', error);
        res.status(500).json({ message: 'Erreur lors de la création de la visite' });
    } finally {
        client.release();
    }
});


router.get('/filieres', authenticate, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT f.id, f.nom_filiere, d.nom_departement, f.est_3a, f.email_1a, f.email_2a, f.email_3a FROM filieres f JOIN departements d ON f.departement_id = d.id ORDER BY d.nom_departement, f.est_3a, f.nom_filiere'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des filières :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des filières' });
    }
});


router.get('/', authenticate, requireAdmin, async (req, res) => {
    const { niveau, filiere_id } = req.query;

    const conditions = [];
    const valeurs = [];

    if (niveau) {
        valeurs.push(niveau);
        conditions.push(`v.niveau = $${valeurs.length}`);
    }

    if (filiere_id) {
        valeurs.push(filiere_id);
        conditions.push(`v.id IN (SELECT visite_id FROM visite_filieres WHERE filiere_id = $${valeurs.length})`);
    }

    if (req.user.role === 'secondaire') {
        if (req.user.filiere) {
            valeurs.push(req.user.filiere.trim().toLowerCase());
            conditions.push(`v.id IN (
                SELECT vf.visite_id FROM visite_filieres vf
                JOIN filieres f ON f.id = vf.filiere_id
                WHERE LOWER(TRIM(f.nom_filiere)) = $${valeurs.length}
            )`);
        } else if (req.user.departement) {
            valeurs.push(req.user.departement.trim().toLowerCase());
            conditions.push(`v.id IN (
                SELECT vf.visite_id FROM visite_filieres vf
                JOIN filieres f ON f.id = vf.filiere_id
                JOIN departements d ON d.id = f.departement_id
                WHERE LOWER(TRIM(d.nom_departement)) = $${valeurs.length}
            )`);
        } else {
            return res.status(403).json({ message: 'Compte admin sans département assigné.' });
        }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        const result = await pool.query(`
            SELECT v.*,
                STRING_AGG(f.nom_filiere, ', ' ORDER BY f.nom_filiere) AS filieres,
                JSON_AGG(JSON_BUILD_OBJECT('id', f.id, 'nom', f.nom_filiere) ORDER BY f.nom_filiere) AS filieres_data
            FROM visites v
            JOIN visite_filieres vf ON vf.visite_id = v.id
            JOIN filieres f ON f.id = vf.filiere_id
            ${whereClause}
            GROUP BY v.id
            ORDER BY v.date_visite DESC
        `, valeurs);
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des visites :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des visites' });
    }
});


router.get('/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const visiteResult = await pool.query('SELECT * FROM visites WHERE id = $1', [id]);
        if (visiteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Visite introuvable' });
        }
        const filieresResult = await pool.query(
            'SELECT filiere_id FROM visite_filieres WHERE visite_id = $1',
            [id]
        );
        res.json({
            ...visiteResult.rows[0],
            filiere_ids: filieresResult.rows.map(r => r.filiere_id)
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la visite :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de la visite' });
    }
});


router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const {
        niveau, date_visite, entreprise, adresse, ville,
        heure_arrivee, heure_depart, nb_gr_eleves, nb_eleves,
        mode_transport_eleve, nb_professeurs, mode_transport_prof,
        nom_professeur, observations, filieres
    } = req.body;

    const erreurPut = validerChampsVisite(req.body);
    if (erreurPut) return res.status(400).json({ message: erreurPut });

    if (!Array.isArray(filieres) || filieres.length === 0) {
        return res.status(400).json({ message: 'Au moins une filière doit être sélectionnée.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const statutCheck = await client.query('SELECT statut FROM visites WHERE id = $1', [id]);
        if (statutCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Visite introuvable' });
        }
        if (statutCheck.rows[0].statut === 'validee' && !estPrincipalOuSuperAdmin(req.user)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Seul le service de stage peut modifier une visite déjà validée.' });
        }

        await client.query(`
            UPDATE visites SET
                niveau = $1, date_visite = $2, entreprise = $3, adresse = $4, ville = $5,
                heure_arrivee = $6, heure_depart = $7, nb_gr_eleves = $8, nb_eleves = $9,
                mode_transport_eleve = $10, nb_professeurs = $11, mode_transport_prof = $12,
                nom_professeur = $13, observations = $14
            WHERE id = $15
        `, [
            niveau, date_visite, entreprise, adresse, ville,
            heure_arrivee, heure_depart, nb_gr_eleves, nb_eleves,
            mode_transport_eleve, nb_professeurs, mode_transport_prof,
            nom_professeur, observations, id
        ]);

        await client.query('DELETE FROM visite_filieres WHERE visite_id = $1', [id]);
        for (const filiere_id of filieres) {
            await client.query('INSERT INTO visite_filieres (visite_id, filiere_id) VALUES ($1, $2)', [id, filiere_id]);
        }

        await client.query('COMMIT');
        res.json({ message: 'Visite modifiée avec succès' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la modification de la visite :', error);
        res.status(500).json({ message: 'Erreur lors de la modification de la visite' });
    } finally {
        client.release();
    }
});


router.patch('/:id/valider', authenticate, requireAdmin, async (req, res) => {
    if (!estPrincipalOuSuperAdmin(req.user)) {
        return res.status(403).json({ message: 'Seul le service de stage peut valider une visite' });
    }

    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE visites SET statut = 'validee' WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Visite introuvable' });
        }

        const visite = result.rows[0];

        try {
            const colEmail = visite.niveau === '1A' ? 'email_1a'
                           : visite.niveau === '2A' ? 'email_2a'
                           : 'email_3a';

            const filieresVisite = await pool.query(
                `SELECT f.nom_filiere, f.${colEmail} AS email_liste
                 FROM filieres f
                 JOIN visite_filieres vf ON vf.filiere_id = f.id
                 WHERE vf.visite_id = $1`,
                [visite.id]
            );

            const niveauLabel = visite.niveau === '1A' ? '1ère année'
                              : visite.niveau === '2A' ? '2ème année'
                              : '3ème année';
            const dateFormatee = new Date(visite.date_visite).toLocaleDateString('fr-FR');
            const formatHeure = (h) => h ? String(h).slice(0, 5) : '';
            const dateRabat = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

            const ccDirection = process.env.CC_VISITE ||
                'directeur@enim.ac.ma,direction.pedagogique@enim.ac.ma,sg@enim.ac.ma,achat@enim.ac.ma,restaurant@enim.ac.ma';

            for (const filiere of filieresVisite.rows) {
                if (!filiere.email_liste) continue;

                const pdfBuffer = await generateNoticePdf(
                    visite, filiere.nom_filiere, dateFormatee, dateRabat, niveauLabel
                );

                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
                        <p>Bonjour,</p>
                        <p>
                            Veuillez trouver en pièce jointe la note de visite d'entreprise
                            à destination des élèves ingénieurs de <strong>${escapeHtml(niveauLabel)}</strong>
                            — <strong>${escapeHtml(visite.entreprise)}</strong>, le <strong>${escapeHtml(dateFormatee)}</strong>.
                        </p>
                        <br>
                        <hr style="border:none; border-top:1px solid #ccc; margin-bottom:12px;">
                        <p style="font-size:0.85em; color:#555; margin:0; line-height:1.8;">
                            <strong>Chef de Service des stages</strong><br>
                            +212 661 044 967<br>
                            <a href="mailto:stage@enim.ac.ma" style="color:#002147;">stage@enim.ac.ma</a><br>
                            CVthèque : <a href="https://cvtheque.enim.ac.ma/" style="color:#002147;">https://cvtheque.enim.ac.ma/</a><br>
                            Formulaire de dépôt des offres : <a href="https://forms.gle/jjzsdUfKyCzDxJE9A" style="color:#002147;">https://forms.gle/jjzsdUfKyCzDxJE9A</a>
                        </p>
                    </div>
                `;

                const nomFichier = `Note_visite_${visite.entreprise.replace(/\s+/g, '_')}_${dateFormatee.replace(/\//g, '-')}.pdf`;

                const pieces = [{ filename: nomFichier, content: pdfBuffer, contentType: 'application/pdf' }];

                const studentsResult = await pool.query(
                    `SELECT matricule, nom, prenom FROM etudiants_eligibles
                     WHERE niveau = $1 AND LOWER(TRIM(nom_filiere_nettoye)) = LOWER(TRIM($2)) AND actif = true
                     ORDER BY nom, prenom`,
                    [visite.niveau, filiere.nom_filiere]
                );
                const etudiants = studentsResult.rows;

                if (etudiants.length > 0) {
                    const emargementBuffer = await generateEmargementPdf(
                        etudiants, visite, filiere.nom_filiere, dateFormatee, niveauLabel
                    );
                    const nomEmargement = `Emargement_${filiere.nom_filiere.replace(/\s+/g, '_')}_${dateFormatee.replace(/\//g, '-')}.pdf`;
                    pieces.push({ filename: nomEmargement, content: emargementBuffer, contentType: 'application/pdf' });
                }

                await sendEmail(
                    filiere.email_liste,
                    `Visite d'entreprise – ${visite.entreprise} le ${dateFormatee}`,
                    html,
                    '',
                    pieces,
                    ccDirection
                );
            }
            const nbEnvoyes = filieresVisite.rows.filter(f => f.email_liste).length;
            console.log(`Notifications envoyées à ${nbEnvoyes} liste(s) de diffusion`);
        } catch (emailError) {
            console.warn('Erreur envoi emails visite :', emailError.message);
        }

        res.json({ message: 'Visite validée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la validation de la visite :', error);
        res.status(500).json({ message: 'Erreur lors de la validation de la visite' });
    }
});


router.get('/:id/notice-pdf/:filiere_id', authenticate, requireAdmin, async (req, res) => {
    const { id, filiere_id } = req.params;
    try {
        const visiteResult = await pool.query('SELECT * FROM visites WHERE id = $1', [id]);
        if (visiteResult.rows.length === 0) return res.status(404).json({ message: 'Visite introuvable' });
        const visite = visiteResult.rows[0];

        const filiereResult = await pool.query('SELECT nom_filiere FROM filieres WHERE id = $1', [filiere_id]);
        if (filiereResult.rows.length === 0) return res.status(404).json({ message: 'Filière introuvable' });
        const filiere = filiereResult.rows[0];

        const niveauLabel = visite.niveau === '1A' ? '1ère année' : visite.niveau === '2A' ? '2ème année' : '3ème année';
        const dateFormatee = new Date(visite.date_visite).toLocaleDateString('fr-FR');
        const dateRabat = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

        const pdfBuffer = await generateNoticePdf(visite, filiere.nom_filiere, dateFormatee, dateRabat, niveauLabel);

        const nomFichier = `Note_visite_${visite.entreprise.replace(/\s+/g, '_')}_${dateFormatee.replace(/\//g, '-')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Erreur génération notice PDF:', error);
        res.status(500).json({ message: 'Erreur lors de la génération du PDF' });
    }
});


router.get('/:id/emargement-pdf/:filiere_id', authenticate, requireAdmin, async (req, res) => {
    const { id, filiere_id } = req.params;
    try {
        const visiteResult = await pool.query('SELECT * FROM visites WHERE id = $1', [id]);
        if (visiteResult.rows.length === 0) return res.status(404).json({ message: 'Visite introuvable' });
        const visite = visiteResult.rows[0];

        const filiereResult = await pool.query('SELECT nom_filiere FROM filieres WHERE id = $1', [filiere_id]);
        if (filiereResult.rows.length === 0) return res.status(404).json({ message: 'Filière introuvable' });
        const filiere = filiereResult.rows[0];

        const niveauLabel = visite.niveau === '1A' ? '1ère année' : visite.niveau === '2A' ? '2ème année' : '3ème année';
        const dateFormatee = new Date(visite.date_visite).toLocaleDateString('fr-FR');

        const studentsResult = await pool.query(
            `SELECT matricule, nom, prenom FROM etudiants_eligibles
             WHERE niveau = $1 AND LOWER(TRIM(nom_filiere_nettoye)) = LOWER(TRIM($2)) AND actif = true
             ORDER BY nom, prenom`,
            [visite.niveau, filiere.nom_filiere]
        );
        const etudiants = studentsResult.rows;

        const emargementBuffer = await generateEmargementPdf(etudiants, visite, filiere.nom_filiere, dateFormatee, niveauLabel);

        const nomFichier = `Emargement_${filiere.nom_filiere.replace(/\s+/g, '_')}_${dateFormatee.replace(/\//g, '-')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}"`);
        res.send(emargementBuffer);
    } catch (error) {
        console.error('Erreur génération émargement PDF:', error);
        res.status(500).json({ message: 'Erreur lors de la génération du PDF' });
    }
});


router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const statutCheck = await client.query('SELECT statut FROM visites WHERE id = $1', [id]);
        if (statutCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Visite introuvable' });
        }
        if (statutCheck.rows[0].statut === 'validee' && !estPrincipalOuSuperAdmin(req.user)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Seul le service de stage peut supprimer une visite déjà validée.' });
        }

        await client.query('DELETE FROM visite_filieres WHERE visite_id = $1', [id]);
        const result = await client.query('DELETE FROM visites WHERE id = $1', [id]);
        await client.query('COMMIT');

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Visite introuvable' });
        }

        res.json({ message: 'Visite supprimée avec succès' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la suppression de la visite :', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de la visite' });
    } finally {
        client.release();
    }
});

module.exports = router;
