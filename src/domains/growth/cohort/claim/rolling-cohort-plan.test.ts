import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingCohortPlan } from "./rolling-cohort-plan.js";

test("RollingCohortPlan starts in open", () => {
  const item = newRollingCohortPlan("code-856", "label-281");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingCohortPlan moves to in review", () => {
  const item = newRollingCohortPlan("code-856", "label-281");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RollingCohortPlan rejects moves from archived", () => {
  const item = newRollingCohortPlan("code-856", "label-281");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
