# GitHub Profile Audit & Standardization — TheStreamCode

**Account:** `TheStreamCode` (Michael Gasperini / Mikesoft) · **Date:** 2026-06-21
**Scope:** 16 public non-fork repositories. Excluded: 5 public forks (no templating on forks) and 21 private repos.

## Executive summary

The account was **not a greenfield**. Branch protection, secret scanning + push protection, and the core
community-health files (LICENSE, CONTRIBUTING, SECURITY, FUNDING) were already in place across the public
repos. The work was therefore **surgical gap-closing**, not an overhaul.

Everything below was applied. File changes went through one **`chore/repo-standardization` pull request per
repo** (15 PRs, left open for owner review/merge). Metadata and branch-protection changes were applied
directly via the GitHub API.

---

## What was applied

### Metadata (via API — direct, reversible)
- **Dependabot alerts** enabled on all 16 repos (were OFF on 15/16).
- **Topics** added to the 9 repos that had none (SEO sets: core tech + language + use-case + ecosystem).
- **Homepage** set on the 6 repos that lacked one (npm page / VS Code Marketplace page / `mikesoft.it`).

### Governance / CI files (via PR — one branch per repo)
- **Code of Conduct** added to 9 repos that lacked it.
- **Issue templates** (bug + feature) and **PR template** added where missing.
- **`dependabot.yml`** added to 13 repos (npm + github-actions weekly; composer + github-actions for the PHP repo).
- **CI least-privilege** `permissions: contents: read` declared in 12 workflows that ran on the broad default token.
- **CITATION.cff** added to all 15 software repos.
- **`package.json` keywords** added to `copilot-byok-switcher` (registry discoverability).

Git metadata records the owner's identity for the cited commits; it is attribution evidence, not a broader
ownership claim. Any ownership statement is limited to original materials owned by the account owner; dependencies,
third-party content, and third-party names, logos, and marks are excluded and remain subject to their respective
terms. References to third-party products or services are for identification only and do not imply endorsement,
sponsorship, or affiliation. All new files match the author's existing template style (verbatim Code-of-Conduct, issue/PR templates,
dependabot layout).

### Branch protection (via API)
- **Required status checks** wired to the real CI contexts on **all 15** active repos.
- **Harmonized** `chutes-media-mcp` and `chutes-model-provider-vscode` up to the standard (added linear history /
  conversation resolution they were missing). All other protection settings were preserved verbatim.
- Confirmed owner-only bypass (`enforce_admins=false`) everywhere — matches the stated governance.

### Security fix (via PR)
- **`discord-management-mcp`**: pinned `undici` to `^6.27.0` via `overrides` to clear 4 advisories (high/moderate)
  that were transitive through `discord.js`. `npm audit` now reports **0 vulnerabilities**; `discord.js@14.26.4`
  unchanged; typecheck + 19 tests pass. Folded into PR #3, whose CI is now green.

### Brand / access control
- **Profile README** and **`sponsor-page.md`**: already aligned (international framing, correct sponsor link
  `github.com/sponsors/TheStreamCode`, no Italy-only tools featured). **No change needed** — left intact.
- **Access control**: clean — owner-only collaborator, zero deploy keys, zero webhooks on every repo.

### Social preview — declined
Custom 1280×640 OG images were generated and reviewed, but the owner opted to rely on **GitHub's
automatically generated preview** (repo name + avatar + description) rather than upload a custom image per
repo (no REST API exists for the upload). The generated assets were removed.

---

## Repository classification

| Repo | Type | Maturity | Notes |
|---|---|---|---|
| super-cli | CLI / VS Code ext | Stable | Flagship; 14 topics; published to Marketplace |
| chutes-media-mcp | MCP server + CLI | Beta | Published on npm (v1.1.0) |
| discord-management-mcp | MCP server | Beta | Pre-existing dependency vuln (see below) |
| chutes-model-provider-vscode | VS Code ext | Beta | Marketplace |
| chutes-usage-vscode | VS Code ext | Beta | Marketplace |
| antigravity-cli-launcher · codex-cli-launcher · github-copilot-cli-launcher · grok-build-launcher · vscode-kilo-cli-launcher | VS Code ext (launcher family) | Stable | Consistent, well-documented siblings |
| copilot-byok-switcher | CLI | Alpha | Not yet published to npm |
| agentic-rd-skill | Agent Skill | Beta | MIT; full governance |
| keysoft | Mobile app (Android) | Beta | Offline-first; bun toolchain |
| mikesoft-teamvault | WordPress plugin | Stable | GPL-2.0; published on wordpress.org |
| easypiva | Web app | Stable | Italy tax tool; Vercel deploy |
| TheStreamCode | Profile README | — | Already excellent; untouched |

---

## Issues found & their disposition

| Issue | Severity | Status |
|---|---|---|
| Dependabot alerts off (15/16) | Medium | **Fixed** (enabled) |
| 9 repos with no topics, 6 with no homepage | Medium (SEO) | **Fixed** |
| Missing Code of Conduct / issue / PR templates on launcher family + a few others | Low | **Fixed via PR** |
| CI workflows running on broad default token (12) | Medium | **Fixed** (`permissions: contents: read`) |
| Two repos with weaker branch protection | Low | **Fixed** (harmonized) |
| No required status checks anywhere | Low | **Fixed** (14 repos) |
| `discord-management-mcp`: `undici` vulnerable (transitive via `discord.js`) flagged by CI `npm audit` | **High** | **Fixed** — `overrides: undici ^6.27.0`; 0 vulnerabilities; tests pass (PR #3). |
| Social preview images absent | Low (SEO) | Declined by owner — GitHub's auto-generated preview used instead. |

False positive discarded: `actions/checkout@v5/@v6` and `setup-node@v5/@v6` are **newer** than v4, not deprecated — left as-is.

---

## Global scorecard (1–10, pre → post)

| Dimension | Pre | Post | Driver |
|---|:--:|:--:|---|
| Security | 7.0 | 9.0 | `undici` advisory fixed, Dependabot alerts on, least-privilege CI, required checks on all 15. |
| Documentation | 8.0 | 9.0 | CoC / templates / CITATION; community health to ~100%. Already strong READMEs. |
| SEO / Discoverability | 5.0 | 8.5 | Topics + homepage everywhere, CITATION. (Custom OG images declined; GitHub auto-preview used.) |
| Governance | 7.5 | 9.5 | Required checks on all 15, harmonized protection, issue/PR templates. |
| Brand consistency | 8.5 | 9.0 | Consistent author/sponsor metadata; profile already coherent. |
| **Overall professionalism** | **7.5** | **9.0** | |

---

## Status
All 15 `chore/repo-standardization` PRs were **merged** (squash, owner admin-bypass) and local working copies
synced to `main`. No open hand-offs remain.

## Not done — by design
- **Release automation** (npm / `vsce`) intentionally not added — most packages aren't auto-published and it would
  add inert, secret-dependent surface. Add per-repo only if/when you want CI publishing.
