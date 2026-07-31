<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Positionnement produit (décision du 31/07/2026)

**Ne jamais présenter l'investissement éthique comme un raccourci vers l'enrichissement.**
C'est faux, personne ne peut le garantir, et l'app cible explicitement des non-experts en
finance qui ne peuvent pas détecter cette survente.

- Un dividende faible/nul ≠ entreprise non rentable — souvent l'inverse (réinvestissement).
  Ce qui compte pour l'épargne long terme : le **rendement total** (plus-value + dividendes
  réinvestis), pas le dividende seul.
- Exclure des secteurs pour des raisons éthiques (fossiles, armement…) a un **coût
  d'opportunité réel et documenté** en finance (littérature sur la "prime des sin stocks").
  Rien ne garantit qu'un portefeuille éthique sur- ou sous-performe un indice classique.
- Les labels ne représentent PAS le même compromis rendement/impact : ISR reste orienté
  performance financière ; Greenfin cible le climat avec un univers plus restreint ;
  **Solidaire (Finansol) est délibérément conçu pour un rendement inférieur au marché**
  en échange d'impact social — ce n'est pas un défaut, c'est l'objet du label. Ne jamais
  les traiter comme interchangeables dans une feature ou un texte.

**Comment appliquer** : toute nouvelle feature ou copie UI touchant à la performance, aux
labels ESG, ou aux scores doit soit rester silencieuse sur le rendement attendu, soit
l'aborder avec cette nuance explicite. Voir
[`docs/decisions/2026-07-31-positionnement-rendement-impact.md`](docs/decisions/2026-07-31-positionnement-rendement-impact.md)
pour le contexte complet de cette décision.
