# Task 2 marking audit

## Sources

- [IELTS Writing Task 2 public band descriptors, May 2023](https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf), pages 1–3 of the Task 2 section.
- [IELTS General Training Writing sample tasks and examiner comments, 2023](https://ielts.org/cdn/Sample-tests/ielts-general-training-writing-sample-tasks-2023.pdf), Task 2B scripts A, B and C.

The sample PDF gives an overall task band and narrative comments, not four criterion bands. Benchmark comparisons therefore use only the published overall band. They cannot prove which individual criterion was mis-scored.

## Root causes and boundaries

1. The displayed 4.5 is mathematically consistent with 5, 4, 4, 4: the mean is 4.25 and the app rounds to the nearest half band. The discrepancy begins in the model's criterion ratings, not in response parsing or rounding (`server/scoring.ts`, `src/App.tsx`).
2. The former skill only briefly listed the four criteria, while the live prompt foregrounded eight grammar and word-choice annotations (`skills/ielts-writing-marker/SKILL.md`, `server/marker.service.ts`). It did not tell the model to judge overall progression separately from grammar or to evaluate whether errors impede communication. This plausibly caused an error-counting bias; a single prior response does not prove a systematic bias.
3. The former live prompt included notes naming the Band 6 shopping sample and its examiner score. That is benchmark leakage, so those notes are now kept for human reference and are excluded from live marking (`docs/IELTS_GT_MARKING_NOTES.md`, `server/marker.service.ts`).
4. Structured JSON constrained the output shape, but the server formerly checked only the number and range of criterion bands. It did not reject duplicate or misnamed criteria or empty reasons (`server/feedback.schema.json`, `server/scoring.ts`). Server validation now requires the four correct criteria in order with reasons.
5. Codex previously inherited the user's local model and reasoning configuration. The default is now explicit: `gpt-6-sol` at medium reasoning effort, with `IELTS_CODEX_MODEL` and `IELTS_CODEX_REASONING_EFFORT` overrides. Record overrides when comparing benchmark runs.
6. The UI showed a 250-word target but the model was not told the essay length. The server now supplies an approximate whitespace-delimited count. There is no fixed penalty for falling below 250 words: the official Band 6 shopping script is about 243 words under this counting rule. Shortness matters when it limits development or evidence of language range. The public descriptors specify Band 1 for 20 words or fewer.

## Descriptor checks

- **Task Response:** Band 6 addresses the main prompt parts, even unevenly, with relevant ideas that may be underdeveloped. Band 4 tackles the task minimally or tangentially. Relevance and coverage drive this criterion.
- **Coherence and Cohesion:** Band 6 has clear overall progression despite faulty or mechanical links. Band 4 lacks clear progression. Local grammatical slips do not establish a coherence failure by themselves.
- **Lexical Resource:** Band 6 meaning is generally clear despite restricted or imprecise vocabulary and some spelling or word-formation errors. Band 4 errors may impede meaning and the resource is inadequate for the task.
- **Grammatical Range and Accuracy:** Band 6 uses simple and complex forms, with errors that rarely impede communication. Band 4 has very limited structures and frequent errors that may impede meaning.

The revised skill directs the model to make these four judgments independently, cite distinct evidence, and create annotations after scoring. It does not set a target band or adjust criterion numbers to match a sample.

## Repeatable benchmark

`benchmarks/task2-shopping.json` contains examiner-marked Task 2B scripts A (Band 4), B (Band 6), and C (Band 8.5). These are evaluation data only and are never sent to the marker with their labels. Run with a signed-in Codex CLI:

```bash
npm run benchmark
npm run benchmark -- --id=task2b-b --runs=3
```

The command invokes the production `MarkerService` for each essay, prints the examiner band, estimated band and delta, and writes `benchmarks/latest-report.json` with all four criterion reasons. Its default acceptance tolerance is one overall band; change it with `--tolerance=0.5` if desired. This tolerance is an evaluation threshold, not a score adjustment. Review the criterion reasons and variance across repeated runs, not just pass/fail.

This environment cannot run Codex CLI inside its shell sandbox (`failed to initialize in-process app-server client: Operation not permitted`). The benchmark harness was built, but a live examiner comparison remains to be run in the user's normal terminal. Unit tests and TypeScript/build checks do not establish examiner agreement.
