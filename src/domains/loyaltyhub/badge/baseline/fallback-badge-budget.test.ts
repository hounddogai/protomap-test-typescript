import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackBadgeBudget } from "./fallback-badge-budget.js";

test("FallbackBadgeBudget starts in planned", () => {
  const item = newFallbackBadgeBudget("code-358", "title-964");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackBadgeBudget moves to in progress", () => {
  const item = newFallbackBadgeBudget("code-358", "title-964");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("FallbackBadgeBudget rejects moves from cancelled", () => {
  const item = newFallbackBadgeBudget("code-358", "title-964");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
