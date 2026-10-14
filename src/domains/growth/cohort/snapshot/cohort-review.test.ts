import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortReview } from "./cohort-review.js";

test("CohortReview starts in planned", () => {
  const item = newCohortReview("code-44", "name-968");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortReview moves to in progress", () => {
  const item = newCohortReview("code-44", "name-968");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CohortReview rejects moves from cancelled", () => {
  const item = newCohortReview("code-44", "name-968");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
