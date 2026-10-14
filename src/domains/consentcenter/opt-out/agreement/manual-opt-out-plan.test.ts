import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualOptOutPlan } from "./manual-opt-out-plan.js";

test("ManualOptOutPlan starts in requested", () => {
  const item = newManualOptOutPlan("code-191", "name-221");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualOptOutPlan moves to granted", () => {
  const item = newManualOptOutPlan("code-191", "name-221");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ManualOptOutPlan rejects moves from expired", () => {
  const item = newManualOptOutPlan("code-191", "name-221");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
