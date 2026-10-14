import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortThreshold } from "./cohort-threshold.js";

test("CohortThreshold starts in created", () => {
  const item = newCohortThreshold("code-199", "label-4");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortThreshold moves to retired", () => {
  const item = newCohortThreshold("code-199", "label-4");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("CohortThreshold rejects moves from retired", () => {
  const item = newCohortThreshold("code-199", "label-4");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
