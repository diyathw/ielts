export type CriterionScore = { name: string; band: number; reason: string }

export const criterionNames = {
  "Task 1": ["Task Achievement", "Coherence and Cohesion", "Lexical Resource", "Grammatical Range and Accuracy"],
  "Task 2": ["Task Response", "Coherence and Cohesion", "Lexical Resource", "Grammatical Range and Accuracy"],
} as const

export function validateCriteria(task: "Task 1" | "Task 2", criteria: unknown): asserts criteria is CriterionScore[] {
  if (!Array.isArray(criteria) || criteria.length !== 4 || criteria.some((item, index) =>
    !item || typeof item !== "object" ||
    item.name !== criterionNames[task][index] ||
    typeof item.reason !== "string" || !item.reason.trim() ||
    typeof item.band !== "number" || !Number.isFinite(item.band) ||
    item.band < 0 || item.band > 9 || item.band * 2 !== Math.round(item.band * 2)
  )) {
    throw new Error("Codex returned invalid or incomplete IELTS criterion scores.")
  }
}

export function calculateTaskBand(criteria: CriterionScore[]) {
  if (criteria.length !== 4 || criteria.some(({ band }) =>
    !Number.isFinite(band) || band < 0 || band > 9 || band * 2 !== Math.round(band * 2)
  )) {
    throw new Error("Codex returned invalid criterion bands.")
  }

  const rawAverage = criteria.reduce((total, criterion) => total + criterion.band, 0) / 4
  return {
    rawAverage,
    overallBand: Math.round(rawAverage * 2) / 2,
  }
}
