import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveSuppressionPolicy } from "./adaptive-suppression-policy.js";

test("AdaptiveSuppressionPolicy starts in idle", () => {
  const item = newAdaptiveSuppressionPolicy("code-243", "label-326");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveSuppressionPolicy moves to warming", () => {
  const item = newAdaptiveSuppressionPolicy("code-243", "label-326");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("AdaptiveSuppressionPolicy rejects moves from stopped", () => {
  const item = newAdaptiveSuppressionPolicy("code-243", "label-326");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
