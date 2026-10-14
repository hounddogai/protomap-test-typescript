import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientSuppressionThreshold } from "./lenient-suppression-threshold.js";

test("LenientSuppressionThreshold starts in idle", () => {
  const item = newLenientSuppressionThreshold("code-258", "name-137");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientSuppressionThreshold moves to ready", () => {
  const item = newLenientSuppressionThreshold("code-258", "name-137");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LenientSuppressionThreshold rejects moves from stopped", () => {
  const item = newLenientSuppressionThreshold("code-258", "name-137");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
