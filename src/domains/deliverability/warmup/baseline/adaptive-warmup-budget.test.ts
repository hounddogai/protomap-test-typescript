import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveWarmupBudget } from "./adaptive-warmup-budget.js";

test("AdaptiveWarmupBudget starts in new", () => {
  const item = newAdaptiveWarmupBudget("code-927", "label-939");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveWarmupBudget moves to running", () => {
  const item = newAdaptiveWarmupBudget("code-927", "label-939");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("AdaptiveWarmupBudget rejects moves from failed", () => {
  const item = newAdaptiveWarmupBudget("code-927", "label-939");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
