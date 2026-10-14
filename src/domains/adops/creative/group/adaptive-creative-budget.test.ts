import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveCreativeBudget } from "./adaptive-creative-budget.js";

test("AdaptiveCreativeBudget starts in idle", () => {
  const item = newAdaptiveCreativeBudget("code-887", "title-359");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveCreativeBudget moves to warming", () => {
  const item = newAdaptiveCreativeBudget("code-887", "title-359");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("AdaptiveCreativeBudget rejects moves from stopped", () => {
  const item = newAdaptiveCreativeBudget("code-887", "title-359");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
