import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionThreshold } from "./suppression-threshold.js";

test("SuppressionThreshold starts in idle", () => {
  const item = newSuppressionThreshold("code-513", "name-991");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionThreshold moves to ready", () => {
  const item = newSuppressionThreshold("code-513", "name-991");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SuppressionThreshold rejects moves from stopped", () => {
  const item = newSuppressionThreshold("code-513", "name-991");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
