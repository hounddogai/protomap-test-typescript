import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackReplyBudget } from "./fallback-reply-budget.js";

test("FallbackReplyBudget starts in open", () => {
  const item = newFallbackReplyBudget("code-530", "name-152");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackReplyBudget moves to in review", () => {
  const item = newFallbackReplyBudget("code-530", "name-152");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackReplyBudget rejects moves from archived", () => {
  const item = newFallbackReplyBudget("code-530", "name-152");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
