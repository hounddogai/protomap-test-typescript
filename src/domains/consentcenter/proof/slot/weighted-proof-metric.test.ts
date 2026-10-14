import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedProofMetric } from "./weighted-proof-metric.js";

test("WeightedProofMetric starts in created", () => {
  const item = newWeightedProofMetric("code-778", "name-408");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedProofMetric moves to validated", () => {
  const item = newWeightedProofMetric("code-778", "name-408");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("WeightedProofMetric rejects moves from retired", () => {
  const item = newWeightedProofMetric("code-778", "name-408");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
