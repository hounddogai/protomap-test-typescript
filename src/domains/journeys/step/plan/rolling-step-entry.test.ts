import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingStepEntry } from "./rolling-step-entry.js";

test("RollingStepEntry starts in planned", () => {
  const item = newRollingStepEntry("code-526", "title-135");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingStepEntry moves to cancelled", () => {
  const item = newRollingStepEntry("code-526", "title-135");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("RollingStepEntry rejects moves from cancelled", () => {
  const item = newRollingStepEntry("code-526", "title-135");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
