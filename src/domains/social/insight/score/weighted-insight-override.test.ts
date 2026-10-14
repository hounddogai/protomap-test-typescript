import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedInsightOverride } from "./weighted-insight-override.js";

test("WeightedInsightOverride starts in idle", () => {
  const item = newWeightedInsightOverride("code-95", "label-864");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedInsightOverride moves to warming", () => {
  const item = newWeightedInsightOverride("code-95", "label-864");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("WeightedInsightOverride rejects moves from stopped", () => {
  const item = newWeightedInsightOverride("code-95", "label-864");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
