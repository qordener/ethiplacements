# Mini-DPIA — Import bancaire (OFX/CSV)

**Date :** 2026-08-08
**Statut :** Acceptée — périmètre option A (relevé compte-titres/PEA uniquement) validé par l'utilisateur le 08/08/2026
**Mandat :** epi-security, précondition posée lors du débat du 31/07/2026 avant tout développement

## 1. Nature des données concernées — la vraie question à trancher d'abord

L'intitulé "import bancaire (OFX/CSV)" du backlog initial recouvre en réalité **deux
imports de nature très différente**, jamais distingués jusqu'ici :

| Option | Contenu | Sensibilité |
|---|---|---|
| **A — Relevé du compte-titres / PEA** | Ordres d'achat/vente, dividendes, versements. Même nature que les `Transaction` (BUY/SELL/DIVIDEND) et `Deposit` déjà gérés manuellement dans l'app. | Faible surcroît — extension d'un périmètre de données déjà traité |
| **B — Relevé de compte courant complet** | Toutes les opérations bancaires : loyer, salaire, achats, dons, cotisations, prélèvements divers. | **Élevée** — peut révéler des données sensibles au sens RGPD (voir §2) |

**Aucune des deux n'a été distinguée dans le backlog original.** C'est la première
chose à clarifier avant d'écrire une ligne de code, car les deux ont des profils de
risque incomparables.

## 2. Risque spécifique de l'option B — données sensibles par ricochet

Un relevé de compte courant contient des libellés d'opération en texte libre :
"COTISATION CGT", "PHARMACIE DU CENTRE", "DON PAROISSE ST-X", "ADHESION PARTI Y".
Ces libellés peuvent révéler, indirectement mais de façon quasi certaine sur un
historique de plusieurs mois, des données relevant de l'**article 9 du RGPD**
(catégories particulières : santé, opinions politiques, convictions religieuses,
appartenance syndicale). Stocker ce niveau de détail dans une base locale, même
non transmise à un tiers, dépasse largement la finalité affichée du produit
("suivre mes placements éthiques") et le principe de **minimisation** (art. 5.1.c RGPD).

L'option A n'a pas ce problème : les libellés d'un compte-titres sont structurés
(ticker, quantité, prix, type d'opération), pas du texte libre de dépense courante.

## 3. Recommandation

**Limiter l'import bancaire à l'option A (relevé de compte-titres / PEA)
exclusivement.** Ne jamais importer ou parser un relevé de compte courant.

Cette restriction :
- Élimine le risque de données sensibles par ricochet
- Reste strictement dans la finalité du produit (suivi de placements)
- Réutilise un modèle de données déjà en place (`Transaction`, `Deposit`) — moins
  de travail, pas une nouvelle catégorie de données à gérer

## 4. Base légale et posture de conformité

L'application est un outil **local, mono-utilisateur, à usage strictement
personnel** (le développeur suit son propre PEA). Le traitement relève de
l'exemption "activité strictement personnelle ou domestique" (RGPD, art. 2.2.c) :
l'app elle-même n'est pas responsable de traitement au sens formel du RGPD tant
qu'elle reste un outil local sans transmission à un tiers ni usage par d'autres
personnes. Cette exemption **disparaîtrait** si le mode multi-utilisateurs était
un jour réintroduit (cohérent avec la décision déjà prise de l'abandonner).

Cela ne dispense pas d'appliquer les bonnes pratiques ci-dessous — c'est une
question de rigueur, pas seulement de conformité formelle.

## 5. Mesures de minimisation et de sécurité pour l'implémentation

- **Ne jamais persister le fichier brut** (OFX/CSV importé) au-delà du temps de
  traitement de la requête — seules les `Transaction`/`Deposit` qui en sont
  dérivées sont stockées. Pas de table `ImportedFile` ni de blob en base.
- **Parsing** : choisir la librairie après un contrôle CVE explicite avant
  installation (leçon du choix `exceljs` vs `xlsx` sur le sourcing ESG) — ne pas
  répéter l'erreur d'installer avant de vérifier.
- **Validation stricte du format** attendu (colonnes/champs OFX ou CSV
  spécifiques au compte-titres) — rejeter tout fichier ne correspondant pas au
  schéma attendu plutôt que de tenter un parsing permissif qui accepterait
  silencieusement un relevé de compte courant.
- **Aperçu avant import** : afficher les lignes détectées (dates, montants,
  type d'opération) et demander confirmation explicite avant d'écrire en base —
  jamais d'import silencieux/automatique.
- **Pas de journalisation** des montants ou libellés importés dans les logs
  applicatifs (cohérent avec la checklist sécurité déjà appliquée ailleurs dans
  le projet).

## 6. Droits des personnes concernées

Sans objet au sens formel (exemption ménage, §4) — l'utilisateur a par
construction un contrôle total : base SQLite locale, suppression possible à tout
moment via l'UI existante ou en supprimant le fichier `.db`.

## 7. Décision requise avant de coder

Confirmer le périmètre **option A uniquement** (relevé compte-titres/PEA) avant
tout développement. Si un besoin réel d'agrégation du compte courant apparaissait
un jour (ex. pour un calcul de capacité d'épargne), il devrait faire l'objet d'une
feature et d'une DPIA séparées et explicites — jamais glissé dans celle-ci.
