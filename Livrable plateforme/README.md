# Livrable — Plateformes du Service des Stages

École Nationale Supérieure des Mines de Rabat — août 2026

Ce dossier réunit la documentation et les fichiers de référence des deux plateformes :

- **Conventions de stage** — https://stage.enim.ac.ma
- **Visites d'entreprise** — https://visite.enim.ac.ma

## Contenu

| Fichier | Destinataire | Objet |
|---|---|---|
| `1 - Guide etudiant - ENSMR.pdf` | Étudiants | Créer son compte, déposer une demande de convention, suivre son dossier, transmettre ses pièces |
| `2 - Guide administrateur - ENSMR.pdf` | Service des stages, chefs de département | Instruire les demandes, rendre un avis pédagogique, organiser les visites, tenir la configuration à jour |
| `3 - Dossier technique - ENSMR.pdf` | Service informatique | Technologies, services indispensables, variables d'environnement, certificats SSL, configurations particulières |
| `Filieres - fichier unique ENSMR.xlsx` | Service des stages | Filières et listes de diffusion. Se dépose sur les deux plateformes depuis leur tableau de bord |

## Comptes livrés

Huit comptes, avec un mot de passe initial commun **à changer dès la première connexion, sur chacune des deux plateformes** — leurs bases étant indépendantes, un changement ne se propage pas.

| Adresse | Périmètre |
|---|---|
| `stage@enim.ac.ma` | Compte principal, service des stages |
| `chef-dgi@enim.ac.ma` | Génie Industriel |
| `chef-dgpi@enim.ac.ma` | Génie des Procédés Industriels |
| `chef-dgm@enim.ac.ma` | Génie des Matériaux |
| `chef-dem@enim.ac.ma` | Électromécanique |
| `chef-dinfo@enim.ac.ma` | Informatique |
| `chef-dm@enim.ac.ma` | Mines |
| `chef-dst@enim.ac.ma` | Sciences de la Terre |

## Points restant à traiter

Ces trois points ne dépendent pas des applications et relèvent du service informatique.

1. **Créer les boîtes `chef-d*@enim.ac.ma`.** Les comptes existent dans les bases, mais sans boîte réelle, un chef de département qui perd son mot de passe ne pourra pas le réinitialiser. Seule `chef-dgi` a été fournie par l'établissement ; les six autres sont des propositions à valider.
2. **Renouveler le certificat SSL avant le 6 février 2027.** Passé cette date, les navigateurs refuseront l'accès aux deux plateformes. La procédure figure au chapitre 4 du dossier technique.
3. **Copier les sauvegardes sur un support distinct.** Une sauvegarde quotidienne automatique est en place, mais elle réside sur la même machine : elle protège d'une fausse manœuvre, pas d'une défaillance matérielle.

## Mise à jour de la documentation

Les sources de ces documents ne sont pas versionnées ici. Pour toute correction, se reporter au dossier technique, qui décrit l'installation dans son état livré.
