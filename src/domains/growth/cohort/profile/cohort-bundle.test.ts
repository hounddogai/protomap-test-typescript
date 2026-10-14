import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortBundle } from "./cohort-bundle.js";

test("CohortBundle starts in planned", () => {
  const item = newCohortBundle("code-201", "label-131");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortBundle moves to cancelled", () => {
  const item = newCohortBundle("code-201", "label-131");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("CohortBundle rejects moves from cancelled", () => {
  const item = newCohortBundle("code-201", "label-131");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
