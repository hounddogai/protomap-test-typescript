import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveFrequencyGroup } from "./adaptive-frequency-group.js";

test("AdaptiveFrequencyGroup starts in idle", () => {
  const item = newAdaptiveFrequencyGroup("code-534", "label-16");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveFrequencyGroup moves to ready", () => {
  const item = newAdaptiveFrequencyGroup("code-534", "label-16");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("AdaptiveFrequencyGroup rejects moves from stopped", () => {
  const item = newAdaptiveFrequencyGroup("code-534", "label-16");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
