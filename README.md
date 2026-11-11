# IELTS Essay Marker

A local IELTS Writing practice app. The React and TypeScript editor uses shadcn-style components. A NestJS API asks your signed-in Codex CLI to assess your essay using the project skill at `skills/ielts-writing-marker/SKILL.md`.

## Run it

In the app window terminal, run:

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173` after the terminal prints `IELTS app ready`. The same NestJS process serves the React page and the API. Add the IELTS question, write your response, then click **Mark with Codex**. The draft saves in your browser. Keep the terminal running while using the app. Marking requires `codex` to be installed and signed in (`codex login status`).

For a quick start, use **Use an official General Training sample task** in the editor. The prompts come from the [IELTS General Training sample tasks](https://ielts.org/cdn/Sample-tests/ielts-general-training-writing-sample-tasks-2023.pdf). The app calculates a practice task band from the four equal-weight criterion scores and shows the calculation.

The header has a dark mode toggle. After marking, the **Marked response** section highlights short passages with hover or tap correction tips. Project plans and the converted PDF text are indexed in `docs/README.md`.

## Check it

```bash
npm run check
npm test
npm run build
curl http://127.0.0.1:5173/api/health
```

The health command should return `{"ok":true}` while `npm run dev` is running. IELTS bands shown in the UI are AI estimates for practice.
