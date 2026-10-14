import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortPlan } from "./cohort-plan.js";

test("CohortPlan starts in requested", () => {
  const item = newCohortPlan("code-451", "name-449");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortPlan moves to granted", () => {
  const item = newCohortPlan("code-451", "name-449");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CohortPlan rejects moves from expired", () => {
  const item = newCohortPlan("code-451", "name-449");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
