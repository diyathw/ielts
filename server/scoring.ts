export type CriterionScore = { name: string; band: number; reason: string }

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
