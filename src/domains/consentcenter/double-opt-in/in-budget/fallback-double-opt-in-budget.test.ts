import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackDoubleOptInBudget } from "./fallback-double-opt-in-budget.js";

test("FallbackDoubleOptInBudget starts in created", () => {
  const item = newFallbackDoubleOptInBudget("code-316", "name-326");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackDoubleOptInBudget moves to published", () => {
  const item = newFallbackDoubleOptInBudget("code-316", "name-326");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("FallbackDoubleOptInBudget rejects moves from retired", () => {
  const item = newFallbackDoubleOptInBudget("code-316", "name-326");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
