import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedCohortBundle } from "./batched-cohort-bundle.js";

test("BatchedCohortBundle starts in created", () => {
  const item = newBatchedCohortBundle("code-841", "label-349");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedCohortBundle moves to published", () => {
  const item = newBatchedCohortBundle("code-841", "label-349");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("BatchedCohortBundle rejects moves from retired", () => {
  const item = newBatchedCohortBundle("code-841", "label-349");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
