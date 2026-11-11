const test = require("node:test")
const assert = require("node:assert/strict")
const { calculateTaskBand } = require("./dist/scoring.js")

function scores(...bands) {
  return bands.map((band, index) => ({ name: `Criterion ${index + 1}`, band, reason: "Example" }))
}

test("a 4.5 criterion can still give a 6.0 task estimate", () => {
  assert.deepEqual(calculateTaskBand(scores(4.5, 6.5, 6.5, 6.5)), {
    rawAverage: 6,
    overallBand: 6,
  })
})

test("rounds a four-criterion average to the nearest half band", () => {
  assert.deepEqual(calculateTaskBand(scores(5.5, 6, 6, 6)), {
    rawAverage: 5.875,
    overallBand: 6,
  })
})

test("rejects missing and invalid criterion bands", () => {
  assert.throws(() => calculateTaskBand(scores(6, 6, 6)))
  assert.throws(() => calculateTaskBand(scores(6, 6, 6, 9.5)))
  assert.throws(() => calculateTaskBand(scores(6, 6, 6, 5.2)))
})
