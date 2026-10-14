import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedCohortException } from "./weighted-cohort-exception.js";

test("WeightedCohortException starts in new", () => {
  const item = newWeightedCohortException("code-24", "label-544");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedCohortException moves to queued", () => {
  const item = newWeightedCohortException("code-24", "label-544");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("WeightedCohortException rejects moves from failed", () => {
  const item = newWeightedCohortException("code-24", "label-544");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
