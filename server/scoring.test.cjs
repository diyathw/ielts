const test = require("node:test")
const assert = require("node:assert/strict")
const { calculateTaskBand, validateCriteria, criterionNames } = require("./dist/scoring.js")
const { countWords } = require("./dist/marker.service.js")

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

test("requires four distinct criterion names in task order and substantive reasons", () => {
  const criteria = criterionNames["Task 2"].map(name => ({ name, band: 6, reason: "Evidence from this criterion" }))
  assert.doesNotThrow(() => validateCriteria("Task 2", criteria))
  assert.throws(() => validateCriteria("Task 2", [criteria[0], criteria[0], criteria[2], criteria[3]]))
  assert.throws(() => validateCriteria("Task 2", criteria.map((item, index) => index === 1 ? { ...item, reason: " " } : item)))
  assert.throws(() => validateCriteria("Task 1", criteria))
})

test("server word count handles empty text and whitespace consistently", () => {
  assert.equal(countWords(""), 0)
  assert.equal(countWords("One\n two   three"), 3)
})
