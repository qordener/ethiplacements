# EthiPlacements

Outil **local-first** de suivi de placements éthiques et ISR (Investissement Socialement Responsable). Fonctionne entièrement sur votre machine — aucune donnée n'est envoyée vers un service tiers.

## Objectif

Permettre à un épargnant soucieux de l'impact de ses placements de :

- Suivre ses portefeuilles (actions, ETF, obligations, livrets)
- Visualiser et comparer les scores ESG de ses actifs
- Identifier les labels obtenus (ISR, Greenfin, Solidaire/Finansol)
- Suivre l'historique de ses transactions et la performance de ses positions

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

- [Node.js](https://nodejs.org) >= 20
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

| Label | Description |
|---|---|
| **ISR** | Investissement Socialement Responsable — label public français |
| **Greenfin** | Finance verte — label du Ministère de la Transition Écologique |
| **Solidaire** | Épargne solidaire — label Finansol |

## Schéma de données

```
Portfolio → Holding → Transaction
           Holding → Asset → EsgScore
```

- `Asset` : types supportés — `STOCK`, `ETF`, `BOND`, `CRYPTO`, `OTHER`
- `EsgScore` : score 0–100, provider (ex: MSCI, Sustainalytics, manuel), détail E/S/G

## Roadmap

Voir [NEXT_STEPS.md](./NEXT_STEPS.md) pour la feuille de route complète.
