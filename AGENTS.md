# Repository Instructions

These instructions apply to the entire repository.

## Purpose

This repository renders the GitHub profile page for [TheStreamCode](https://github.com/TheStreamCode).

- `README.md` is the rendered profile page.
- `assets/` holds the header images used by the page.
- `scripts/generate-profile-stats.mjs` regenerates the statistics block.
- `.github/workflows/` lints Markdown and refreshes the statistics.

## Invariants

- Keep the public wording English, sentence case, second person where it addresses the reader. No
  emoji, no exclamation marks, no promotional superlatives.
- Keep the page accurate: no repository, product or metric that is not live.
- Keep the statistics block generated. Do not hand-edit numbers that the script produces.
- The badge strip under the intro is maintained by hand. Round its numbers down so they stay true
  between refreshes, and update it when a count moves enough to matter.
- Keep links absolute and stable.

## Validation

```powershell
npx --yes markdownlint-cli2 "README.md"
```

## Change boundaries

- Do not commit, push, tag or change GitHub settings unless the user explicitly authorizes it.
- Do not add AI-attribution or generated-by footers to commits, pull requests or documentation.
