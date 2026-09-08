# Sourcing des scores ESG — remplacer la note par des faits

**Date :** 2026-09-04
**Statut :** Acceptée — option A (remplacement de `EsgScore` par des indicateurs factuels)
validée par l'utilisateur le 04/09/2026. Réserves du § 8 à lever avant implémentation.

## 1. Contexte

Le sourcing réel des scores ESG a été identifié « en creux » par l'économiste lors du
débat du 31/07, et jugé **plus prioritaire que n'importe lequel des cinq items du backlog
initial**. Il est resté non traité depuis.

L'état à ce jour est asymétrique :

- Les **labels officiels** (ISR / Greenfin / Finansol) sont sourcés depuis le référentiel
  trimestriel de la Banque de France (livré le 08/08). Le modèle `AssetLabel` porte
  `source`, `asOfDate` et `fetchedAt`, et son commentaire énonce déjà la doctrine :
  *« un fait vérifiable avec source et date, pas une estimation »*.
- Le **score ESG numérique** reste saisi à la main. Le schéma l'admet explicitement :
  `EsgScore.provider` vaut `"manual"`.

La question posée était : **quelle source** pour ce score. Une recherche a été menée le
04/09/2026 pour y répondre. Sa conclusion principale est négative, et elle réoriente la
question.

## 2. Constat central

**Il n'existe pas de score ESG numérique gratuit, fiable et adressable par ISIN au niveau
des fonds.**

Les notations à couverture large — MSCI, Sustainalytics, ISS — sont toutes propriétaires
et payantes. Ce qui est gratuit relève de l'une des deux catégories suivantes :

- **niveau entreprise et scrapé**, donc ni fiable ni pérenne ;
- **factuel plutôt que noté**, donc pas un score.

Ce constat confirme l'intuition de l'économiste du 31/07 : la contrainte n'était pas un
manque de recherche, elle est structurelle.

## 3. Deux pièges à documenter, car ils sont contre-intuitifs

### 3.1 Yahoo Finance / Sustainalytics — le faux chemin naturel

Le projet consomme déjà Yahoo Finance pour les prix, ce qui rend tentant d'y prendre aussi
l'ESG. C'est à écarter, pour trois raisons cumulatives :

1. **Pas d'API officielle** — la donnée s'obtient par scraping HTML, sans engagement de
   stabilité ni conditions de réutilisation claires.
2. **Couverture entreprise uniquement** — environ 86 % des constituants du S&P 500, aucun
   fonds ni ETF. Or le portefeuille cible est un PEA d'ETF et de fonds labellisés.
3. **Échelle inversée** — le *ESG Risk Rating* de Sustainalytics mesure un **risque** :
   **plus bas est meilleur**. `EsgScore.score` est documenté « 0 à 100 » dans la
   convention inverse. Brancher la source sans inverser produirait un classement
   exactement à l'envers, silencieusement.

Le troisième point est le plus dangereux : il ne casse rien, il ment.

### 3.2 Agréger un score au niveau d'un ETF fabrique de la fausse précision

Calculer un score ESG pour un ETF suppose de connaître ses constituants **et leurs
pondérations**. Reconstituer cela à partir de scores d'entreprises obtenus ailleurs, sur
un panier qu'on ne connaît qu'approximativement, produit un nombre d'apparence précise
sans fondement vérifiable.

C'est précisément ce que le positionnement du 31/07 interdit : *ne pas créer de fausse
précision*. Le piège vaut donc indépendamment de la source retenue.

## 4. Ce qui est exploitable dès aujourd'hui

Toutes ces données sont gratuites et relèvent du fait daté et citable, pas de l'estimation
propriétaire.

| Source | Niveau | Clé | Nature de la donnée |
|---|---|---|---|
| **SBTi** — Target Dashboard | Entreprise | **ISIN + LEI** | Objectif climat validé : oui/non |
| **Banque de France** | Fonds | ISIN | Labels ISR/Greenfin/Finansol — *déjà intégré* |
| **Classification SFDR** art. 6/8/9 | Fonds | ISIN | Déclaratif réglementaire |
| **Alignement taxonomie UE** | Fonds | ISIN | Pourcentage réglementaire |
| **Indicateurs PAI** | Fonds | ISIN | Quantitatif standardisé |

**SBTi** est la source la plus immédiatement actionnable : fichier `.xlsx` gratuit, mis à
jour chaque jeudi, publiant **ISIN et LEI** — donc directement raccordable à la saisie
ISIN déjà en place pour les labels.

### Le trou structurel : les données EET

Le standard de place au niveau fonds est l'**EET** (European ESG Template) de FinDatEx,
version 1.1.3 recommandée depuis le 01/01/2025 : environ 600 champs couvrant SFDR, PAI et
taxonomie, clé ISIN. Mais **FinDatEx publie le gabarit gratuitement, pas les données
remplies**. Celles-ci proviennent des sociétés de gestion, sans point de collecte central
et gratuit.

C'est la raison de fond pour laquelle les données fonds restent difficiles d'accès malgré
une standardisation aboutie.

## 5. L'horizon réglementaire — ESAP, mais pas avant 2028

Le règlement (UE) 2023/2859 institue **ESAP**, point d'accès unique gratuit, officiel et
lisible par machine aux informations financières et de durabilité européennes.

- Ouverture de la plateforme : **10 juillet 2027**
- Données de durabilité : **deuxième vague, janvier 2028**
- Périmètre complet : janvier 2030

ESAP est la réponse propre à la question posée, mais elle n'est pas disponible avant
janvier 2028. Toute décision prise aujourd'hui doit donc être **transitoire par
construction** et ne pas rendre coûteuse la bascule ultérieure vers ESAP.

## 6. Décision

**Cesser de chercher une source pour un score numérique, et remplacer `EsgScore` par un
faisceau d'indicateurs factuels**, chacun porteur de sa source et de sa date — en
généralisant le modèle déjà éprouvé par `AssetLabel`.

Justification : « objectif climat validé par la SBTi au 04/09/2026 » est vérifiable par
l'utilisateur. « 68/100 », d'origine incertaine et d'échelle ambiguë, ne l'est pas — et
est plus nuisible précisément parce qu'il a l'air précis. Pour un public non-expert,
explicitement la cible du produit, un nombre invérifiable est une fausse assurance.

Cette décision prolonge celle du 31/07 plutôt qu'elle ne l'amende : elle applique au score
la doctrine déjà retenue pour les labels.

## 7. Options examinées — **option A retenue**

Le point tranché est un **changement de schéma**, pas un branchement de source. Il engage
les écrans, l'export et le filtre ESG du dashboard. Trois options avaient été posées :

- **A — Remplacement. ✅ Retenue.** Supprimer `EsgScore` au profit d'indicateurs factuels
  typés, sur le modèle d'`AssetLabel`. Le plus cohérent, et le plus coûteux — la surface dépendante
  du score a été relevée et dépasse le seul filtre :
  - le **filtre ESG** du dashboard (« Élevé » ≥ 70 / « Faible » < 40) ;
  - le composant partagé **`score-badge`**, consommé par `portfolio-card` et
    `portfolio-detail.page` ;
  - le **code couleur** par seuils (`portfolio-detail.page.ts:1516`) ;
  - **cinq endpoints** CRUD `esg-scores` côté API et leur service dashboard.

  Un indicateur factuel n'est pas ordonnable comme un score : « objectif SBTi validé »
  est booléen, un alignement taxonomie est un pourcentage réglementaire. Le filtre et le
  badge doivent donc être **repensés**, pas simplement recâblés.
- **B — Cohabitation.** Conserver `EsgScore` en saisie manuelle assumée, et ajouter les
  indicateurs factuels à côté. Moins disruptif, mais maintient à l'écran le nombre dont
  cette analyse conclut qu'il est trompeur.
- **C — Statu quo temporaire.** Ne rien changer et attendre ESAP en janvier 2028. Laisse
  seize mois durant lesquels le produit affiche un score sans source.

Recommandation : **option A**, dont le coût réel est le filtre ESG à redéfinir.

## 8. Réserves — ce qui n'a pas été vérifié

Ces points doivent être levés avant implémentation, pas avant la décision de principe :

- **Licence SBTi** : le site ne documente pas de conditions de réutilisation du jeu de
  données. À vérifier auprès de la SBTi avant toute intégration, y compris locale.
- **Disponibilité réelle des EET** pour les lignes effectivement détenues : reste à
  vérifier lesquels des gérants concernés (Amundi, BNP Paribas AM…) publient un EET en
  accès libre.
- **Couverture SBTi des fonds** : la source est entreprise. Son apport pour un portefeuille
  d'ETF reste à évaluer, et se heurte au piège d'agrégation décrit au § 3.2.
- **Contrainte local-first** : toute source retenue doit être consommable par
  téléchargement de fichier puis traitement local, sans appel tiers portant des données
  utilisateur. SBTi (`.xlsx`) et les référentiels réglementaires y satisfont ; une API
  interrogée par ISIN au fil de l'eau demanderait un examen séparé.

## 9. Sources

- SBTi — Target Dashboard : <https://sciencebasedtargets.org/target-dashboard>
- FinDatEx — European ESG Template : <https://findatex.eu/>
- Règlement (UE) 2023/2859 (ESAP) : <https://eur-lex.europa.eu/eli/reg/2023/2859/oj/eng>
- AMF — ESAP entre en phase de mise en œuvre :
  <https://www.amf-france.org/en/news-publications/news/european-single-access-point-financial-and-non-financial-information-european-entities-esap-enters>
- Société Générale SS — ouverture d'ESAP le 10 juillet 2027 :
  <https://www.securities-services.societegenerale.com/en/insights/views/news/esap-european-single-access-point-the-platform-will-open-on-july-10-2027/>
- Davis Polk — notations Sustainalytics sur Yahoo Finance :
  <https://www.davispolk.com/insights/client-update/sustainalytics-esg-ratings-publicly-available-company-yahoo-finance-page>
- Tidy Intelligence — scraping des données ESG de Yahoo Finance :
  <https://blog.tidy-intelligence.com/posts/scraping-esg-data-from-yahoo-finance/>
