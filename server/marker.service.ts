import { Injectable, InternalServerErrorException } from "@nestjs/common"
import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { calculateTaskBand, type CriterionScore } from "./scoring"

type Essay = { task: "Task 1" | "Task 2"; prompt: string; essay: string }

@Injectable()
export class MarkerService {
  async mark({ task, prompt, essay }: Essay) {
    const tempDir = await mkdtemp(join(tmpdir(), "ielts-marker-"))
    const outputPath = join(tempDir, "feedback.json")
    const schemaPath = join(process.cwd(), "server/feedback.schema.json")
    const skill = await readFile(join(process.cwd(), "skills/ielts-writing-marker/SKILL.md"), "utf8")
    const notes = await readFile(join(process.cwd(), "docs/IELTS_GT_MARKING_NOTES.md"), "utf8")
    const instruction = `Apply the IELTS writing skill below. Do not browse, use tools, or modify files. Return only the JSON object required by the output schema. Give exactly four criteria with their proper names. Do not state a numeric overall band in the summary; the server calculates that from the criteria. Include up to eight annotations of short exact substrings from the essay, focusing on grammar, spelling, word choice, punctuation, and clarity.\n\nSKILL:\n${skill}\n\nOFFICIAL SAMPLE CALIBRATION NOTES:\n${notes}\n\nTASK TYPE:\n${task}\n\nTASK PROMPT:\n${prompt}\n\nSTUDENT ESSAY:\n${essay}`

    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn("codex", [
          "exec", "--ephemeral", "--skip-git-repo-check", "--sandbox", "read-only",
          "--output-schema", schemaPath, "--output-last-message", outputPath, "-",
        ], { cwd: process.cwd(), stdio: ["pipe", "ignore", "pipe"], env: { ...process.env, NO_COLOR: "1" } })
        let stderr = ""
        const timer = setTimeout(() => child.kill("SIGTERM"), 180_000)
        child.stderr.on("data", (chunk: Buffer) => { stderr = (stderr + chunk).slice(-3000) })
        child.on("error", reject)
        child.on("exit", (code) => {
          clearTimeout(timer)
          if (code === 0) resolve()
          else reject(new Error(stderr.includes("Not logged in") ? "Codex is not signed in. Run codex login in your terminal." : "Codex could not mark this essay. Check the terminal for details."))
        })
        child.stdin.end(instruction)
      })
      const feedback = JSON.parse(await readFile(outputPath, "utf8")) as {
        summary: string
        criteria: CriterionScore[]
        strengths: string[]
        improvements: string[]
        nextStep: string
        annotations: { quote: string; category: string; replacement: string; explanation: string }[]
      }
      return {
        ...feedback,
        annotations: (feedback.annotations || []).filter(item => item.quote && essay.includes(item.quote)).slice(0, 8),
        ...calculateTaskBand(feedback.criteria),
      }
    } catch (error) {
      throw new InternalServerErrorException(error instanceof Error ? error.message : "Marking failed.")
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  }
}
