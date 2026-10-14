import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRetentionPlan } from "./global-retention-plan.js";

test("GlobalRetentionPlan starts in proposed", () => {
  const item = newGlobalRetentionPlan("code-141", "name-921");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRetentionPlan moves to approved", () => {
  const item = newGlobalRetentionPlan("code-141", "name-921");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("GlobalRetentionPlan rejects moves from withdrawn", () => {
  const item = newGlobalRetentionPlan("code-141", "name-921");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
