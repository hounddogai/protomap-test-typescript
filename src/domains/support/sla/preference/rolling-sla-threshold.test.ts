import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingSlaThreshold } from "./rolling-sla-threshold.js";

test("RollingSlaThreshold starts in idle", () => {
  const item = newRollingSlaThreshold("code-8", "title-262");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingSlaThreshold moves to draining", () => {
  const item = newRollingSlaThreshold("code-8", "title-262");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("RollingSlaThreshold rejects moves from stopped", () => {
  const item = newRollingSlaThreshold("code-8", "title-262");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
