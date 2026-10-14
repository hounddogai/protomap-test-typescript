import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveDoubleOptInPlan } from "./adaptive-double-opt-in-plan.js";

test("AdaptiveDoubleOptInPlan starts in idle", () => {
  const item = newAdaptiveDoubleOptInPlan("code-81", "label-378");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveDoubleOptInPlan moves to draining", () => {
  const item = newAdaptiveDoubleOptInPlan("code-81", "label-378");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("AdaptiveDoubleOptInPlan rejects moves from stopped", () => {
  const item = newAdaptiveDoubleOptInPlan("code-81", "label-378");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
