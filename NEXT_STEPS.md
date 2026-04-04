## Phase 0 — Setup & Environnement de Développement ✅ En cours

- [ ] NX monorepo initialisé
- [ ] Docker Compose (PostgreSQL + Redis)
- [ ] CI/CD de base

### MCPs à connecter au démarrage du projet

```bash
# Pertinents pour ethiplacements
- context7          → documentation libs (Angular, NestJS, NX)
- PostgreSQL MCP    → interroger la DB en direct depuis Claude CLI
- Figma MCP         → design UI/UX composants
- Claude in Chrome  → scraping portails financiers / tests E2E visuels
```

### Versionning automatisé par agents

- Commits explicites à chaque étape via agent Claude (scheduled ou hook)
- Format : `feat(phase-X): description claire de l'étape`
- Possible dès maintenant via `hooks.PostToolUse` sur les opérations fichiers

---

## Phase 1 — Core API (Auth + CRUD + Modèle de données)

- [ ] Auth JWT (NestJS Guards)
- [ ] Modèle PostgreSQL : `Placement`, `Categorie`, `LabelESG`, `HistoriquePrix`
- [ ] CRUD placements avec labels ESG/ISR/Greenfin/Solidaire
- [ ] Validation des données (class-validator)

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

---

## Phase 2 — Dashboard Angular

- [ ] Structure NX lib `ui-components`
- [ ] Dashboard portefeuille (répartition, performance)
- [ ] Composants graphiques (Chart.js ou Recharts)
- [ ] **Sobriété & accessibilité** : contraste WCAG AA, pas de surcharge visuelle

### Design & UX

- Connecter **Figma MCP** pour générer/synchroniser les composants
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

- [ ] Fetcher prix ETF (sources : Boursorama, Morningstar, Yahoo Finance)
- [ ] Fetcher taux livrets (Livret A, LDDS, LEP...)
- [ ] Scheduler (Celery ou APScheduler)
- [ ] Stockage historique PostgreSQL

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

## Workflow de Développement Recommandé

```
1. Nouvelle fonctionnalité
   → /octo:tdd    (écrire les tests d'abord)
   → /octo:dev    (implémenter)
   → /octo:review (relecture)
   → commit auto via agent

2. Décision d'architecture
   → /octo:plan   (évaluer les options)
   → documenter dans CLAUDE.md ou ADR/

3. UI/UX
   → Figma MCP (maquette)
   → Claude Preview (test visuel)
   → /octo:design-ui-ux
```

---

*Mis à jour : 2026-04-04 — Session Claude Code*
