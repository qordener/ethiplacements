# Recentrage du backlog post-pivot local-first

**Date :** 2026-07-31
**Statut :** Acceptée

## Contexte

Le backlog initial du projet (`NEXT_STEPS.md`, phases 4 et 5, et une liste
"Fonctionnalités Futures") a été rédigé au kickoff, à un moment où l'ambition
incluait potentiellement un partage de l'outil avec d'autres utilisateurs. Depuis,
le projet a explicitement tranché une architecture **local-first** comme décision
définitive (pas d'auth réseau, pas de cloud), et n'a en pratique qu'un seul
utilisateur réel : le développeur, pour son propre PEA ISR.

Ce backlog n'avait jamais été rouvert depuis sa rédaction initiale — y compris
l'item "Mode multi-utilisateurs", qui contredit frontalement la décision
local-first déjà actée.

Deux features livrées récemment (suivi du plafond de versement PEA, comparateur
de performance vs CAC 40 / MSCI World SRI) sont nées d'une friction concrète
vécue par le développeur en utilisant l'application, et ont été tranchées via un
débat contradictoire entre personas (PO, Économiste ESG, Dev, Designer,
Sécurité). Le développeur a demandé qu'un débat équivalent évalue la pertinence
du reste du backlog, en soupçonnant lui-même que ces items pouvaient ne plus être
cohérents avec les besoins réels du projet.

## Débat

Six personas ont été consultés indépendamment (PO, Économiste ESG, Dev,
Designer, Sécurité, et Project Manager — ajouté pour ce débat car la question
portait sur la santé du backlog en tant que processus, pas seulement sur des
features individuelles) sur les 5 items restants du backlog initial.

## Décision

| Item | Verdict | Détail |
|---|---|---|
| **Phase 4 — CalDAV** | Abandonnée | Suppose un serveur externe (Nextcloud/Radicale) que l'utilisateur n'a probablement pas, et ferait transiter des données de portefeuille vers un tiers — contredit le postulat local-first. Redéfinie en une option future beaucoup plus légère : export `.ics` statique, zéro dépendance, à construire seulement si le besoin se fait vraiment sentir. |
| **Phase 5 — Notifications** | Réduite | Pas de système générique ni de SMTP. Un hook `ntfy` minimal reste envisageable, mais uniquement branché sur un déclencheur concret déjà existant (plafond PEA, dérive ESG) — jamais construit en amont d'un besoin. |
| **Import bancaire (OFX/CSV)** | Conservée | Seul item validé sans réserve par les 5 personas techniques/produit — réduit une vraie friction de saisie manuelle. Précondition : mini-DPIA avant tout développement, les données concernées (relevés bancaires complets) étant plus sensibles que le périmètre ESG habituel de l'app. |
| **Export rapport PDF** | Redéfinie | Commencer par un export CSV/JSON brut des données déjà en base plutôt qu'un rapport PDF mis en page — la valeur est dans les chiffres, pas la forme. Un vrai PDF ne se justifie que si un besoin de partage à un tiers (comptable, banque) apparaît concrètement. Si des scores ESG figurent dans l'export : mention obligatoire de la source et de la date des données (exigence de l'économiste, pour éviter une fausse précision). |
| **Mode multi-utilisateurs** | Abandonnée | Verdict unanime des 5 personas. Contredit directement la décision d'architecture local-first déjà tranchée (introduirait de l'auth réseau et une isolation multi-comptes sur une base SQLite qui n'a jamais été pensée pour ça). Le risque sécurité (surface d'attaque permanente dès que le code existe, indépendamment de l'usage réel) a été jugé disproportionné face à une valeur hypothétique — zéro second utilisateur identifié à ce jour. À ne reconsidérer que comme projet distinct si un besoin réel apparaît, jamais comme incrément de l'existant. |

Un besoin non couvert par les 5 items initiaux a été identifié en creux par
l'économiste : le score ESG est aujourd'hui saisi manuellement, sans notation
indépendante réelle. C'est jugé plus prioritaire pour la mission du projet que
n'importe lequel des 5 items débattus.

## Conséquences

- `NEXT_STEPS.md` mis à jour en conséquence (fichier local, non versionné).
- Nouvelle règle adoptée pour l'alimentation future du backlog : un item n'y
  entre qu'après avoir été buté concrètement en utilisant l'application — pas
  parce qu'il pourrait être utile un jour. Chaque nouvel item doit pouvoir
  répondre à *quelle friction concrète, rencontrée quand ?*
- Prochaine étape naturelle si le développeur souhaite continuer sur le
  backlog restant : import bancaire (après le DPIA), ou le sourcing réel des
  scores ESG identifié par l'économiste.
