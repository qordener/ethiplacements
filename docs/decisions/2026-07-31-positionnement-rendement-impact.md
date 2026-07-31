# Positionnement honnête sur le compromis rendement/impact

**Date :** 2026-07-31
**Statut :** Acceptée

## Contexte

En relisant le backlog et les débats précédents, le développeur a identifié un risque de
fond dans la proposition de valeur du projet : l'idée implicite que des placements
"éthiques" permettraient de se constituer une épargne aussi bien, voire mieux, que des
placements classiques — alors que les entreprises à impact positif (environnemental,
social) ne concentrent pas nécessairement leurs efforts sur le versement de dividendes.

Le doute portait sur la cohérence même du projet : si les placements éthiques sont
structurellement moins "rentables", promouvoir cette approche auprès d'un public
non-expert en finance (la cible explicite du produit) serait malhonnête.

## Analyse

Deux confusions distinctes ont été démêlées :

1. **Dividende ≠ rentabilité ≠ rendement total.** Une entreprise qui ne verse pas de
   dividende peut réinvestir ses profits (croissance) plutôt que ne pas en avoir. Ce qui
   construit une épargne long terme est le rendement total (plus-value + dividendes
   réinvestis), pas le dividende isolément. Pour un PEA spécifiquement, dividendes et
   plus-values sont défiscalisés tant que les fonds restent dans l'enveloppe — la
   distinction n'a quasiment aucun impact fiscal pour l'utilisateur cible.

2. **Les fonds/indices labellisés ESG ne sont pas des paniers d'associations caritatives.**
   Le MSCI World SRI (déjà utilisé comme benchmark dans le comparateur) et le label ISR
   restent composés d'entreprises commerciales normales, filtrées/pondérées selon des
   critères E/S/G — pas des organisations à but non lucratif.

Le doute du développeur n'était cependant pas infondé sur un point réel : exclure des
secteurs entiers pour des raisons éthiques (énergies fossiles, armement) a un coût
d'opportunité documenté en finance (littérature sur la "prime des sin stocks" : les
secteurs boudés pour raisons éthiques sont parfois moins chers et donc statistiquement
mieux rémunérés pour le risque). Rien ne garantit qu'un portefeuille éthique sur- ou
sous-performe un indice classique sur la durée — le comparateur livré la veille l'illustre
déjà avec des données réelles (MSCI World SRI à -3,3 % vs CAC 40 à +1,3 % sur un mois).

Un point structurellement différent : le label **Solidaire (Finansol)** finance des
projets à fort impact social (logement social, microfinance) en acceptant un rendement
délibérément inférieur au marché — ce n'est pas un défaut du label, c'est son objet. Les
trois labels du projet (ISR, Greenfin, Solidaire) ne représentent donc pas le même
compromis rendement/impact, et les traiter comme équivalents serait la principale source
de fausses attentes chez un utilisateur non-expert.

## Décision

Le projet n'est pas caduc — sa proposition de valeur est recentrée :

- **Ne plus laisser entendre** que l'investissement éthique serait un raccourci vers
  l'enrichissement, ni qu'il serait nécessairement moins rentable qu'un placement
  classique. Aucune des deux affirmations n'est démontrable et les présenter comme
  acquises serait malhonnête envers un public non-expert.
- **Rendre explicite**, dans le produit (README, tooltips) et pas seulement en interne,
  le compromis rendement/impact réel de chaque label ESG couvert.
- Documenter cette position dans `CLAUDE.md` pour que toute feature ou copie future
  respecte cette nuance sans avoir à redécouvrir le raisonnement.

## Conséquences

- `README.md` : section Objectif reformulée, table des labels ESG enrichie d'une colonne
  "Compromis rendement/impact".
- Tooltip du score ESG (`portfolio-detail.page.ts`) et tooltip du comparateur
  (`comparison-chart.ts`) enrichis d'une note d'honnêteté sur ce que le score/la
  comparaison mesure — et ne prédit pas.
- `CLAUDE.md` : section "Positionnement produit" ajoutée pour les sessions futures.
- Aucun changement de schéma de données ni de code fonctionnel — c'est une clarification
  de positionnement et de contenu pédagogique, pas une nouvelle feature.
