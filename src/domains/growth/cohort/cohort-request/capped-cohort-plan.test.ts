import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedCohortPlan } from "./capped-cohort-plan.js";

test("CappedCohortPlan starts in created", () => {
  const item = newCappedCohortPlan("code-944", "name-389");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedCohortPlan moves to published", () => {
  const item = newCappedCohortPlan("code-944", "name-389");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("CappedCohortPlan rejects moves from retired", () => {
  const item = newCappedCohortPlan("code-944", "name-389");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
