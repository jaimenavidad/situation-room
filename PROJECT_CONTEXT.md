# Situation Room Project Context

## Purpose

Situation Room is an internal web app for managing a project commitments map. It gives an executive portfolio view plus editable project dossiers so project health, milestones, staffing, risks, comments, and operational follow-up can live in one place.

The product is oriented around a Spanish-language workflow for project leadership, PMs, and operational stakeholders who need quick visibility into portfolio health and project-level detail.

## Current Status

- Main branch is connected to GitHub at `jaimenavidad/situation-room`.
- The app is a React + Vite single-page application with Tailwind CSS v4 styling.
- Project data is persisted remotely through Netlify Functions backed by Netlify Blobs.
- Local browser cache is used as a resilience layer while remote data loads or if the network fails.
- The local sample seed is intentionally empty, so the portfolio depends on remote Blobs data or legacy local storage migration.
- The latest visible work focused on favicon updates, consolidated personnel capacity, dossier deletion, glass-theme polish, Netlify Blobs persistence, and Notion PDF import.

## Architecture

- Frontend: React 19 application mounted from `src/main.jsx` into `src/App.jsx`.
- Styling: Tailwind CSS v4 via `@tailwindcss/vite`, plus custom theme tokens and glass/wallpaper styling in `src/index.css`.
- Build tool: Vite with React, Tailwind, and `@netlify/vite-plugin`.
- API layer: Netlify Functions under `netlify/functions/`.
- Persistence: Netlify Blobs store named `situation-room`, key `projects.json`.
- PDF import: Client converts a PDF to base64, posts it to a Netlify Function, then the function uses `pdf-parse` and the shared parser to produce an editable project draft.

The app currently writes the entire project collection on save. It does not have user authentication, per-record conflict resolution, audit history, or a database-backed API.

## Key Files And Directories

- `README.md`: Public setup, stack, features, deploy instructions, and future improvements.
- `src/App.jsx`: Main application state, portfolio filters, dossier editing, comments, project CRUD, PDF import modal, local cache, remote load/save, theme toggle, and consolidated personnel calculations.
- `src/index.css`: Tailwind import, font import, theme variables, wallpaper backgrounds, light/dark mode tokens, glass surfaces, and supporting layout styles.
- `src/main.jsx`: React root setup.
- `src/data/sampleProjects.js`: Empty local seed array.
- `netlify/functions/projects-get.js`: Reads `projects.json` from Netlify Blobs.
- `netlify/functions/projects-save.js`: Validates and writes the full project array to Netlify Blobs.
- `netlify/functions/projects-import-pdf.js`: Accepts base64 PDF input and returns a parsed project draft.
- `netlify/functions/_shared/project-pdf-parser.js`: Normalizes Notion-exported PDF text into Situation Room fields, confidence metadata, and missing-field hints.
- `netlify.toml`: Netlify Functions directory, esbuild bundling, external `pdf-parse`, and SPA redirect to `index.html`.
- `vite.config.js`: Vite plugins for React, Tailwind, and Netlify local emulation.
- `package.json`: Scripts and dependencies.
- `public/wallpapers/`: Light and dark Situation Room background images.
- `public/backdrop-filters.css`: Extra CSS used for backdrop/glass filtering.
- `public/favicon.*` and `public/icons.svg`: App icons and visual assets.

## Local Setup

Use Node/npm with the checked-in `package-lock.json`.

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite. The Netlify Vite plugin emulates Netlify Functions and Blobs locally, so the same `/.netlify/functions/*` routes should be available through the dev server.

Validation commands:

```bash
npm run lint
npm run build
```

## Environment Variables

No explicit environment variables are required in the current codebase.

Netlify Blobs access is handled through Netlify's runtime and `@netlify/vite-plugin` during local development. If deployment or local emulation changes, re-check Netlify Blobs requirements before adding custom env vars.

## Deployment

Recommended pipeline:

```txt
Local -> GitHub main -> Netlify
```

Netlify settings:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

`netlify.toml` already includes the SPA redirect:

```txt
/* -> /index.html 200
```

The repository is designed for pushes to `main` to trigger Netlify deploys once the repo is connected to a Netlify site.

## Data And Persistence

- Remote store name: `situation-room`
- Remote key: `projects.json`
- Remote payload shape: `{ version, savedAt, projects }`
- Read endpoint: `/.netlify/functions/projects-get`
- Save endpoint: `/.netlify/functions/projects-save`
- PDF import endpoint: `/.netlify/functions/projects-import-pdf`
- Local cache key: `situation-room-projects-cache-v1`
- Legacy local storage key: `situation-room-projects-v2`
- Theme key: `situation-room-theme-mode`

Load behavior:

- The app starts from local cache for responsiveness.
- It then attempts to hydrate from Netlify Blobs.
- If remote data is empty, it attempts to migrate legacy local storage data.
- If remote load fails, the app keeps the cached/local state.

Save behavior:

- Saves are debounced by 600 ms after user mutations.
- The app also tries to flush changes on `beforeunload` and when the tab becomes hidden.
- Saves write the full project array, not per-project patches.

## Git And Branching

- Remote: `https://github.com/jaimenavidad/situation-room.git`
- Primary branch: `main`
- Current local branch should track `origin/main`.
- Keep documentation and implementation changes small and intentional.
- Before pushing to `main`, run at least `npm run lint` and `npm run build`.
- For larger feature work, use short-lived branches with a descriptive name and merge back after validation.

## Recent Commit History

- `b5ad8e9` - 2026-06-05 - Update favicon and consolidated leaders
- `1fb1dc7` - 2026-06-05 - Improve consolidated personnel layout
- `7eff736` - 2026-06-05 - Add dossier delete action and tune glass transparency
- `448b1df` - 2026-06-04 - Polish glass UI and portfolio capacity summaries
- `1b7f0b0` - 2026-06-04 - Polish Situation Room theme and portfolio UI
- `e6f1f26` - 2026-06-03 - Add PDF import success confirmation
- `5339bfa` - 2026-06-03 - Stabilize PDF import parser runtime
- `9905538` - 2026-06-03 - Fix PDF parser function bundling
- `6b78196` - 2026-06-03 - Add Notion PDF project importer
- `42827c9` - 2026-06-03 - Prevent empty autosave overwriting remote projects
- `bdba70c` - 2026-06-03 - Harden Netlify Blobs autosave on tab hide
- `c38f95f` - 2026-06-03 - Migrate persistence to Netlify Blobs and polish project dashboard
- `5ce3695` - 2026-06-01 - Initial commit

## Iteration Log

- Initial app foundation: React/Vite app with project portfolio and dossier workflow.
- Persistence iteration: moved away from local-only state into Netlify Blobs through `projects-get` and `projects-save`.
- Autosave hardening: added cache resilience, empty-remote guardrails, and tab-hide/unload flushing.
- Import iteration: added Notion PDF import through Netlify Function parsing, then stabilized bundling/runtime behavior and added success confirmation.
- UI iteration: polished Situation Room visual identity with wallpaper-backed light/dark modes, glass surfaces, capacity summaries, and a favicon.
- Portfolio iteration: added consolidated personnel capacity and improved the layout for leadership/staffing visibility.
- Dossier iteration: added project deletion from the dossier flow.
- Documentation iteration: added this project-context document to preserve status, risks, and next-pass guidance beyond the README.

## Current Risks / Known Issues

- No authentication or authorization. Anyone with access to the deployed app can potentially view and mutate the shared project data.
- Whole-collection saves can overwrite concurrent edits. There is no record-level locking, merge strategy, revision token, or conflict UI.
- No audit log. `lastUpdated` exists per project, but there is no durable history of who changed what.
- Netlify Blobs is the only remote persistence layer. It is simple and useful here, but not a relational database or multi-user collaboration backend.
- Local cache can mask remote load failures. Users may see cached data if the remote read fails.
- PDF import is heuristic and tailored to expected Notion export text. New PDF layouts may require parser updates.
- `pdf-parse` is marked as an external Node module for Netlify bundling; changes to bundling or runtime should be tested carefully.
- `sampleProjects` is empty, so a brand-new environment has no demo data unless remote or legacy data exists.
- No automated tests currently cover parser behavior, persistence edge cases, or UI flows.
- The app relies on Google-hosted fonts from CSS import, which can affect offline/local availability.

## Next Steps

- Add authentication before using the app with sensitive client or staffing information.
- Add optimistic concurrency protection for saves, such as a `savedAt` or revision precondition checked by `projects-save`.
- Add an export/backup workflow for `projects.json`.
- Add parser fixture tests for representative Notion PDF exports.
- Add basic UI smoke tests for portfolio load, create/edit/delete, comments, and PDF import happy/error paths.
- Add a lightweight audit trail for project changes.
- Decide whether Netlify Blobs remains sufficient or whether the app needs a database-backed API as usage grows.
- Add empty-state guidance or demo data for first-run environments.
- Document the deployed Netlify site URL once finalized.

## Non-Negotiables

- Do not overwrite remote project data from an empty or unhydrated client state.
- Keep `npm run lint` and `npm run build` passing before pushing to `main`.
- Preserve the Spanish-language product surface unless intentionally changing product language.
- Treat Netlify Blobs data as production data; avoid manual writes without backup.
- Keep PDF import drafts editable and reviewable before they become real projects.
- Avoid introducing auth, database, or deployment changes without documenting the operational impact.
- Keep `README.md` focused on onboarding/setup and `PROJECT_CONTEXT.md` focused on memory, status, risk, and next actions.
