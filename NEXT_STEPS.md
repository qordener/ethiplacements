# EthiPlacements — Feuille de Route

> Générée depuis `nextSteps.txt` + contexte projet + suggestions Claude Code session Apr 4 2026.
> Mise à jour : Apr 5 2026 — session Claude Code.

---

## 🟢 Décision Architecturale — TRANCHÉE

### Local vs SaaS → **Local-first** ✅

| Critère | Outil local auto-hébergé | Plateforme en ligne |
|---|---|---|
| Confidentialité | ✅ Maximale | ⚠️ Dépend du provider |
| Connexion bancaire | Via MCP Chrome (scraping) | Via agrégateurs (Budget Insight, Powens) |
| Maintenance | À la charge de l'utilisateur | Centralisée |
| Cible | Profils techniques | Grand public |
| Complexité | Faible au départ | Forte (auth OAuth, conformité DSP2) |

**Décision :** Architecture **local-first**, données SQLite sur la machine de l'utilisateur. Adaptateurs agnostiques pour permettre un mode SaaS futur si nécessaire. Pas d'auth réseau en Phase 1.

---

## Phase 0 — Setup & Environnement de Développement ✅ Terminée

- [x] NX monorepo initialisé (apps/api NestJS + apps/dashboard Angular 21 + E2E Playwright)
- [x] Prisma ORM configuré avec SQLite (LibSQL adapter) — remplace Docker/PostgreSQL
- [x] Schéma de données initial migré (Portfolio, Asset, Holding, Transaction, EsgScore)
- [x] PrismaModule intégré dans NestJS AppModule
- [x] Repo GitHub créé — public : **github.com/qordener/ethiplacements**
- [x] Premier commit poussé (147 fichiers, `chore(init)`)
- [x] `.gitignore` complet (DB SQLite, Prisma generated, logs)
- [x] Hook commit automatique configuré (Stop hook dans `.claude/settings.json`)
- [ ] CI/CD validé (`.github/workflows/ci.yml` committé, non encore testé)

### MCPs à connecter au démarrage du projet

```bash
# Pertinents pour ethiplacements
- context7          → documentation libs (Angular, NestJS, NX)
- SQLite/Prisma MCP → interroger la DB en direct depuis Claude CLI
- Figma MCP         → design UI/UX composants
- Claude in Chrome  → scraping portails financiers / tests E2E visuels
```

### Versionning automatisé par agents

- [x] Hook Stop configuré — rappel de commit après chaque session Claude avec liste des fichiers et format suggéré
- [ ] Format de commit enforced : `feat|fix|chore|docs(scope): description`
- [ ] GitHub Actions : lint + test automatiques sur chaque push

---

## Phase 1 — Core API (Modules métier + CRUD)

> Auth JWT non applicable en local-first — pas d'authentification réseau en Phase 1.

- [ ] Module `PortfolioModule` — CRUD complet (NestJS service + controller + DTOs)
- [ ] Module `AssetModule` — CRUD + recherche par ticker/ISIN
- [ ] Module `EsgScoreModule` — création et consultation des scores ESG par actif
- [ ] Module `HoldingModule` — lien Portfolio ↔ Asset avec quantité et prix moyen
- [ ] Module `TransactionModule` — historique des opérations BUY/SELL
- [ ] Validation des données entrantes (`class-validator` + `class-transformer` sur tous les DTOs)
- [ ] Tests unitaires Jest pour chaque service (couverture minimale 80%)
- [ ] Tests E2E API (apps/api-e2e) pour les endpoints critiques

### Skills dédiés à activer pour cette phase

- [x] Skills Claude projet créés dans `.claude/commands/`

| Commande | Rôle | Usage |
|---|---|---|
| `/epi-ctx` | Contexte | Précharge le contexte projet à chaque session |
| `/epi-dev` | Dev NestJS/Angular | Implémentation features |
| `/epi-po` | Product Owner | Définition features, user stories, priorisation |
| `/epi-review` | Code Reviewer | Relecture code, checklist qualité |
| `/epi-qa` | QA / TDD | Tests red-green-refactor, Jest + Playwright |
| `/epi-eco` | Économiste ESG | Validation critères ESG/ISR/Greenfin/Solidaire |
| `/epi-security` | Auditeur Sécurité | Audit OWASP, RGPD, données financières |

> Workflow recommandé : `/epi-qa` (écrire les tests) → `/epi-dev` (implémenter) → `/epi-review` (relecture) → commit

---

## Phase 2 — Dashboard Angular

- [ ] Structure NX lib `ui-components`
- [ ] Dashboard portefeuille (répartition, performance)
- [ ] Composants graphiques (Chart.js ou Recharts)
- [ ] **Sobriété & accessibilité** : contraste WCAG AA, pas de surcharge visuelle

### Design & UX

- [ ] Connecter **Figma MCP** pour générer/synchroniser les composants
- Chaque composant graphique doit embarquer une **info-bulle pédagogique** :
  - Qu'est-ce qu'un ETF ?
  - Différence ISR / Greenfin / label Solidaire ?
  - Comment lire ce graphique ?
- Cible : utilisateur non-expert en finance

### Test visuel avec Claude Preview

```
→ Claude peut afficher et interagir avec l'app Angular en local
→ Vérifier rendu, responsive, accessibilité sans quitter le CLI
```

---

## Phase 3 — Worker Python (Prix ETF + Taux livrets)

- [ ] Fetcher prix ETF (sources à évaluer : AMF open data, Yahoo Finance, Morningstar)
- [ ] Fetcher taux livrets réglementés (Livret A, LDDS, LEP — source : Banque de France)
- [ ] Scheduler (APScheduler ou équivalent)
- [ ] Stockage historique dans SQLite (table `PriceHistory` à ajouter au schéma Prisma)

### MCP Chrome pour le scraping

```
→ Explorer ensemble les sources de données disponibles
→ Identifier la meilleure stratégie (scraping vs API publique vs flux XML/JSON)
→ Exemple : AMF publie des données fonds labellisés en open data
```

### Rapports automatiques (Scheduled Tasks)

```
Chaque lundi 8h → analyser nouveaux cours + variation portefeuille → résumé CLI
```

---

## Phase 4 — Adaptateur CalDAV

- [ ] Intégration Nextcloud / Radicale
- [ ] Rappels : échéances, rééquilibrages, versements programmés
- [ ] Agnostique provider (interface commune)

---

## Phase 5 — Notifications

- [ ] SMTP (emails récap)
- [ ] ntfy (notifications push self-hosted)
- [ ] Agnostique provider

---

## Fonctionnalités Futures à Évaluer

> Issues à ouvrir sur GitHub pour priorisation communautaire.

- **Import bancaire** : export OFX/CSV depuis portail bancaire → import automatique
- **Connexion bancaire via MCP Chrome** : scraping du portail client (local uniquement, aucune credential stockée)
- **Comparateur de placements** : comparer performance vs benchmark (CAC 40, indice MSCI World ESG)
- **Score ESG personnalisé** : pondération selon les valeurs de l'utilisateur
- **Export rapport PDF** : bilan annuel des placements éthiques
- **Mode multi-utilisateurs** : pour version SaaS éventuelle

---

## Workflow de Développement

```
1. Nouvelle fonctionnalité
   → /epi-qa      (écrire les tests d'abord — TDD)
   → /epi-dev     (implémenter)
   → /epi-review  (relecture)
   → commit : feat(scope): description

2. Décision d'architecture
   → /epi-po      (valeur utilisateur + priorisation)
   → /epi-eco     (pertinence ESG/financière)
   → documenter dans NEXT_STEPS.md ou ADR/

3. UI/UX
   → Figma MCP (maquette)
   → /epi-dev (composant Angular)
   → Claude Preview (test visuel)

4. Sécurité / RGPD
   → /epi-security (avant chaque feature touchant les données)
```

---

*Mis à jour : 2026-04-05 — Session Claude Code*
