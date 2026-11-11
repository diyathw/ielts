# IELTS Essay Marker

Read `docs/PLAN.md` before changing this project. Update its current behavior, active issue, and next steps as work progresses so the user does not need to repeat the plan.
Read `docs/MARKING_AUDIT.md` before changing Task 2 scoring. Keep examiner benchmark labels out of the live marking prompt.

- This project uses React, TypeScript, Vite, Tailwind CSS, and shadcn-style UI components in `src/`.
- The local API uses NestJS in `server/`. Keep essay marking on the server; the browser must not run Codex or hold credentials.
- The marking endpoint loads `skills/ielts-writing-marker/SKILL.md`. Update that file when changing IELTS feedback guidance.
- Run `npm run dev` to build the React UI and start NestJS on port 5173. NestJS serves both the UI and API. Restart the command after code changes. Run `npm run check` and `npm run build` after code changes.
- Codex CLI must be installed and signed in for the Mark button to work. The server invokes it with a read-only sandbox and a structured output schema.
- Use `npm run benchmark` to compare against official examiner-marked Task 2 samples when Codex CLI is available. Never hardcode a sample's expected score in production marking code.
