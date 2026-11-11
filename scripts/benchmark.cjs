const { readFileSync, writeFileSync } = require("node:fs")
const { resolve } = require("node:path")
const { MarkerService } = require("../server/dist/marker.service.js")

const fixture = JSON.parse(readFileSync(resolve(__dirname, "../benchmarks/task2-shopping.json"), "utf8"))
const idFlag = process.argv.find(arg => arg.startsWith("--id="))
const repetitions = Number(process.argv.find(arg => arg.startsWith("--runs="))?.split("=")[1] || 1)
const tolerance = Number(process.argv.find(arg => arg.startsWith("--tolerance="))?.split("=")[1] || 1)
if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 10 || !Number.isFinite(tolerance) || tolerance < 0) {
  throw new Error("Use --runs=1..10 and a nonnegative --tolerance=band value.")
}
const samples = idFlag ? fixture.samples.filter(sample => sample.id === idFlag.slice(5)) : fixture.samples
if (!samples.length) throw new Error("No benchmark samples matched.")

async function main() {
  const marker = new MarkerService()
  const results = []
  for (const sample of samples) {
    for (let run = 1; run <= repetitions; run++) {
      const feedback = await marker.mark({ task: "Task 2", prompt: fixture.prompt, essay: sample.essay })
      const delta = feedback.overallBand - sample.examinerBand
      results.push({
        id: sample.id,
        run,
        examinerBand: sample.examinerBand,
        estimatedBand: feedback.overallBand,
        delta,
        criteria: feedback.criteria,
        withinTolerance: Math.abs(delta) <= tolerance,
      })
      process.stdout.write(`${sample.id} run ${run}: examiner ${sample.examinerBand}, estimate ${feedback.overallBand}, delta ${delta >= 0 ? "+" : ""}${delta}\n`)
    }
  }
  const report = {
    source: fixture.source,
    model: process.env.IELTS_CODEX_MODEL || "gpt-6-sol",
    reasoningEffort: process.env.IELTS_CODEX_REASONING_EFFORT || "medium",
    tolerance,
    results,
  }
  const reportPath = resolve(__dirname, "../benchmarks/latest-report.json")
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n")
  process.stdout.write(`Report: ${reportPath}\n`)
  if (results.some(result => !result.withinTolerance)) process.exitCode = 1
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
