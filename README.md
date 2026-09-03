# EthiPlacements

Outil **local-first** de suivi de placements éthiques et ISR (Investissement Socialement Responsable). Fonctionne entièrement sur votre machine — aucune donnée n'est envoyée vers un service tiers.

## Objectif

Permettre à un épargnant non-expert d'aligner son épargne avec ses valeurs, **en comprenant explicitement le compromis rendement/impact que ça implique** — pas de promesse que l'éthique paierait plus, ni moins.

- Suivre ses portefeuilles (actions, ETF, obligations, livrets)
- Visualiser et comparer les scores ESG de ses actifs
- Identifier les labels obtenus (ISR, Greenfin, Solidaire/Finansol) **et ce que chacun implique réellement en termes de rendement attendu**
- Comparer la performance de son portefeuille à des indices/ETF de référence (dont un proxy MSCI World SRI), pour objectiver plutôt que supposer
- Suivre l'historique de ses transactions et la performance de ses positions

### Un point d'honnêteté important

Un dividende faible ou nul ne signifie pas qu'une entreprise n'est pas rentable — souvent l'inverse : elle réinvestit ses profits plutôt que de les distribuer. Ce qui construit une épargne sur le long terme, c'est le **rendement total** (plus-value + dividendes réinvestis), pas le dividende seul. Et exclure des secteurs entiers pour des raisons éthiques (énergies fossiles, armement…) a un coût d'opportunité réel et documenté en finance — rien ne garantit qu'un portefeuille éthique surperforme un indice classique, ni qu'il sous-performe. Ce sont deux choses différentes, et EthiPlacements essaie de les rendre lisibles plutôt que de les confondre.

## Architecture

```
apps/
  api/           NestJS — API REST locale (port 3000)
  dashboard/     Angular 21 — Interface utilisateur
  api-e2e/       Tests E2E Playwright (API)
  dashboard-e2e/ Tests E2E Playwright (dashboard)
```

**Base de données :** SQLite via Prisma ORM — fichier local `apps/api/data/ethiplacements.db`

**Pas d'authentification réseau.** L'outil est conçu pour un usage personnel en local.

## Prérequis

- [Node.js](https://nodejs.org) — versions acceptées par Angular 21 :
  `^20.19.0 || ^22.12.0 || >=24.0.0`. La version de référence du projet est
  épinglée dans `.nvmrc` : `nvm use` suffit.
- npm >= 10

## Installation

```bash
git clone https://github.com/qordener/ethiplacements.git
cd ethiplacements
npm install
```

### Initialiser la base de données

```bash
npx nx run api:prisma-migrate
# ou pour générer uniquement le client Prisma :
npx nx run api:prisma-generate
```

La base de données SQLite est créée automatiquement dans `apps/api/data/ethiplacements.db`.

## Démarrage

### API (NestJS)

```bash
npx nx serve api
# → http://localhost:3000/api
```

### Dashboard (Angular)

```bash
npx nx serve dashboard
# → http://localhost:4200
```

### Les deux en parallèle

```bash
npx nx run-many --target=serve --projects=api,dashboard
```

## Endpoints API

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/portfolios` | Lister tous les portefeuilles |
| `POST` | `/api/portfolios` | Créer un portefeuille |
| `GET` | `/api/portfolios/:id` | Détail + positions |
| `PATCH` | `/api/portfolios/:id` | Modifier |
| `DELETE` | `/api/portfolios/:id` | Supprimer |

## Développement

```bash
# Tests unitaires API
npx nx test api

# Tests en mode watch
npx nx test api --configuration=watch

# Couverture de code
npx nx test api --configuration=coverage

# Lint
npx nx lint api
npx nx lint dashboard
```

### Workflow TDD

```
/epi-qa      → écrire les tests (red)
/epi-dev     → implémenter (green)
/epi-review  → relecture
commit
```

## Labels ESG couverts

Les trois labels ne représentent pas le même compromis rendement/impact — les confondre est la principale source de fausses attentes chez un épargnant non-expert :

| Label | Description | Compromis rendement/impact |
|---|---|---|
| **ISR** | Investissement Socialement Responsable — label public français | Reste orienté performance financière : filtre/pondère selon des critères E/S/G, sans viser un rendement inférieur au marché. Le plus proche d'un placement "classique" avec un filtre éthique. |
| **Greenfin** | Finance verte — label du Ministère de la Transition Écologique | Impact climat ciblé (exclut notamment le nucléaire et les fossiles). Univers d'investissement plus restreint qu'ISR → risque et rendement potentiellement plus dispersés. |
| **Solidaire** (Finansol) | Épargne solidaire | **Rendement délibérément inférieur au marché par construction** — finance des projets à fort impact social (logement social, microfinance, insertion) en échange d'un impact mesurable, pas d'un rendement compétitif. Ce n'est pas un défaut du label, c'est son objet. |

## Schéma de données

```
Portfolio → Holding → Transaction
           Holding → Asset → EsgScore
```

- `Asset` : types supportés — `STOCK`, `ETF`, `BOND`, `CRYPTO`, `OTHER`
- `EsgScore` : score 0–100, provider (ex: MSCI, Sustainalytics, manuel), détail E/S/G

## Roadmap

Voir [NEXT_STEPS.md](./NEXT_STEPS.md) pour la feuille de route complète.
