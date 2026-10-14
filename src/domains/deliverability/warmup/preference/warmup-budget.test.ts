import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupBudget } from "./warmup-budget.js";

test("WarmupBudget starts in created", () => {
  const item = newWarmupBudget("code-317", "label-118");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupBudget moves to validated", () => {
  const item = newWarmupBudget("code-317", "label-118");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("WarmupBudget rejects moves from retired", () => {
  const item = newWarmupBudget("code-317", "label-118");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
