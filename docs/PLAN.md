# IELTS Essay Marker plan

## Goal

Build a local IELTS Writing practice app where the user writes a response in React and asks Codex CLI to mark it through a NestJS backend.

## Agreed stack and sources

- React + TypeScript + Vite UI using shadcn-style components.
- NestJS + TypeScript backend.
- Local, signed-in `codex exec` for marking. No browser API key.
- General Training sample prompts from the official 2023 IELTS General Training Writing sample tasks PDF.
- A project IELTS Writing skill at `skills/ielts-writing-marker/SKILL.md` guides marking against the public Task 2 descriptors.
- The user also identified `https://github.com/Bowie601/ielts-codex-skills`. That repository contains Academic Task 1 chart-writing coaches. Keep those separate from General Training letter/essay marking; adding an Academic coaching mode is awaiting user preference.

## Current behavior

- Task 1 or Task 2 question and response editor with browser draft saving.
- Button to load an official General Training sample task.
- Dark mode toggle that saves the preferred theme in browser storage.
- Marking calls `/api/mark`, which invokes Codex CLI with a read-only sandbox, explicit default model (`gpt-6-sol`, medium reasoning), and structured JSON output.
- The server validates all four criterion names, scores, and reasons, and supplies a word count without applying a fixed underlength deduction.
- Official examiner labels are excluded from live prompts. The three Task 2B scripts and labels are kept in `benchmarks/task2-shopping.json` for offline evaluation.
- Four criterion scores are averaged equally on the server. The UI shows the arithmetic and a practice estimate rounded to a half band.
- Marked response preview highlights exact passages with hover or tap correction tips.
- The 24-page General Training sample PDF is converted to searchable text in `docs/`. Some image-based scripts were not readable by local OCR; examiner comments and task prompts are extracted.
- `npm run dev` builds React and starts one NestJS process on port 5173, serving both the page and API. `npm run check`, `npm test`, and `npm run build` verify the project.

## Recent runtime issue and verification

The user reported an intermittent blank page. A stale NestJS process from before the scoring response change may have returned an older shape. The UI now recalculates the average from criterion scores and validates feedback before displaying it. An error boundary prevents an unhandled render error from leaving a blank screen. The UI checks `/api/health` and shows when the marker is offline. After another `ERR_CONNECTION_REFUSED` in Chrome, `npm run dev` was simplified to one NestJS process that serves both the built React UI and API on port 5173. A prior live Chrome check on 2026-11-10 completed an actual **Mark with Codex** request and displayed four criterion scores, the calculated task average, and feedback; the draft remained intact. The agent's shell sandbox cannot bind to local ports, so local server testing there fails with `EPERM` even when the user's Chrome session can run the app.

## Next steps

1. Run `npm run benchmark` in the normal terminal and inspect the three official examiner comparisons and criterion reasons. The Codex CLI cannot initialize inside this agent's shell sandbox.
2. Verify the single-process server, dark mode, and hover annotations in a live browser after restarting `npm run dev`.
3. If the user confirms Academic Task 1 support, add it as a separate mode. Do not apply Bowie601's Academic chart coaches to General Training letters.
4. If the blank page recurs, capture the terminal output and browser console at the time of failure.

The detailed Task 2 pipeline audit and descriptor comparison are in `docs/MARKING_AUDIT.md`.

## Working notes

- Preserve the user's draft when debugging. It is stored under browser local storage key `ielts-essay-draft-v1`.
- The user prefers a single terminal command that starts both UI and backend.
- Explain score differences with the four criterion values; do not rely on a model-supplied overall band.
