import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingCohortMilestone } from "./rolling-cohort-milestone.js";

test("RollingCohortMilestone starts in requested", () => {
  const item = newRollingCohortMilestone("code-38", "title-624");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingCohortMilestone moves to granted", () => {
  const item = newRollingCohortMilestone("code-38", "title-624");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RollingCohortMilestone rejects moves from expired", () => {
  const item = newRollingCohortMilestone("code-38", "title-624");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
