import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackLevelBudget } from "./fallback-level-budget.js";

test("FallbackLevelBudget starts in open", () => {
  const item = newFallbackLevelBudget("code-750", "name-832");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackLevelBudget moves to resolved", () => {
  const item = newFallbackLevelBudget("code-750", "name-832");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FallbackLevelBudget rejects moves from archived", () => {
  const item = newFallbackLevelBudget("code-750", "name-832");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
