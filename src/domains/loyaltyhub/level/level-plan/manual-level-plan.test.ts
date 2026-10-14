import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualLevelPlan } from "./manual-level-plan.js";

test("ManualLevelPlan starts in requested", () => {
  const item = newManualLevelPlan("code-260", "label-310");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualLevelPlan moves to granted", () => {
  const item = newManualLevelPlan("code-260", "label-310");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ManualLevelPlan rejects moves from expired", () => {
  const item = newManualLevelPlan("code-260", "label-310");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
