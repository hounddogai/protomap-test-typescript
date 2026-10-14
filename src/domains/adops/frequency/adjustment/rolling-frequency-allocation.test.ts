import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingFrequencyAllocation } from "./rolling-frequency-allocation.js";

test("RollingFrequencyAllocation starts in new", () => {
  const item = newRollingFrequencyAllocation("code-318", "name-936");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingFrequencyAllocation moves to done", () => {
  const item = newRollingFrequencyAllocation("code-318", "name-936");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("RollingFrequencyAllocation rejects moves from failed", () => {
  const item = newRollingFrequencyAllocation("code-318", "name-936");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
