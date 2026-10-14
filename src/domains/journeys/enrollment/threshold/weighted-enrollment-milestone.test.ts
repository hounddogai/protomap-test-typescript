import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedEnrollmentMilestone } from "./weighted-enrollment-milestone.js";

test("WeightedEnrollmentMilestone starts in new", () => {
  const item = newWeightedEnrollmentMilestone("code-388", "name-69");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedEnrollmentMilestone moves to running", () => {
  const item = newWeightedEnrollmentMilestone("code-388", "name-69");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("WeightedEnrollmentMilestone rejects moves from failed", () => {
  const item = newWeightedEnrollmentMilestone("code-388", "name-69");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
