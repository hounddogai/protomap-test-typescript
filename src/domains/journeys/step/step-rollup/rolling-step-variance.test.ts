import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingStepVariance } from "./rolling-step-variance.js";

test("RollingStepVariance starts in idle", () => {
  const item = newRollingStepVariance("code-707", "label-82");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingStepVariance moves to warming", () => {
  const item = newRollingStepVariance("code-707", "label-82");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RollingStepVariance rejects moves from stopped", () => {
  const item = newRollingStepVariance("code-707", "label-82");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
