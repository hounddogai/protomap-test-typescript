import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackModelBudget } from "./fallback-model-budget.js";

test("FallbackModelBudget starts in idle", () => {
  const item = newFallbackModelBudget("code-443", "label-983");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackModelBudget moves to ready", () => {
  const item = newFallbackModelBudget("code-443", "label-983");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FallbackModelBudget rejects moves from stopped", () => {
  const item = newFallbackModelBudget("code-443", "label-983");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
