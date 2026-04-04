---
description: "Charge le contexte complet du projet ethiplacements. UTILISER en début de session ou quand tu as besoin de rappeler l'architecture, les décisions, l'état d'avancement ou le schéma de données. EXEMPLES: 'reprends le projet', 'quel est l'état du projet', 'rappelle-moi l'architecture'."
---

Charge et affiche le contexte complet du projet ethiplacements pour initialiser cette session.

## À afficher

Présente de façon structurée :

### Stack & Architecture
- **Monorepo** : NX — `apps/api` (NestJS), `apps/dashboard` (Angular 21), `apps/api-e2e`, `apps/dashboard-e2e` (Playwright)
- **Base de données** : SQLite via Prisma ORM (LibSQL adapter) — local-first, fichier `apps/api/data/ethiplacements.db`
- **Build** : Webpack (api), Angular CLI (dashboard)
- **Package manager** : npm

### Décision architecturale tranchée
**Local-first** : l'outil tourne en local sur la machine de l'utilisateur. Pas d'auth, pas de backend cloud. Architecture agnostique pour permettre un mode SaaS futur si nécessaire.

### Schéma de données (Prisma)
```
Portfolio → Holding → Transaction
           Holding → Asset → EsgScore
```
Modèles : `Portfolio`, `Asset` (STOCK/ETF/BOND/CRYPTO/OTHER), `Holding`, `Transaction` (BUY/SELL), `EsgScore` (score 0-100, provider, détail E/S/G en JSON)

### État d'avancement
- ✅ Phase 0 — Setup NX monorepo, Prisma SQLite, PrismaModule intégré dans NestJS
- ⏳ Phase 1 — Core API : modules métier (Portfolio, Asset, ESGScore) à implémenter
- ⏳ Phase 2 — Dashboard Angular : composants, graphiques, pédagogie
- ⏳ Phase 3 — Worker Python : fetch prix ETF/livrets
- ⏳ Phase 4 — Adaptateur CalDAV
- ⏳ Phase 5 — Notifications

### Labels ESG cibles
ISR (Investissement Socialement Responsable), Greenfin (finance verte), Solidaire (épargne solidaire / Finansol)

### Workflow de développement
```
/epi-qa   → écrire les tests (TDD first)
/epi-dev  → implémenter
/epi-review → relecture
commit via agent
```

### Skills disponibles
| Commande | Rôle |
|---|---|
| `/epi-ctx` | Contexte projet (ce fichier) |
| `/epi-dev` | Développeur NestJS/Angular |
| `/epi-po` | Product Owner |
| `/epi-review` | Code Reviewer |
| `/epi-qa` | QA / TDD |
| `/epi-eco` | Économiste ESG |
| `/epi-security` | Auditeur Sécurité |

$ARGUMENTS
