import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortMilestone } from "./cohort-milestone.js";

test("CohortMilestone starts in draft", () => {
  const item = newCohortMilestone("code-996", "name-381");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortMilestone moves to pending", () => {
  const item = newCohortMilestone("code-996", "name-381");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CohortMilestone rejects moves from closed", () => {
  const item = newCohortMilestone("code-996", "name-381");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
