import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveReplyBudget } from "./adaptive-reply-budget.js";

test("AdaptiveReplyBudget starts in planned", () => {
  const item = newAdaptiveReplyBudget("code-142", "name-889");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveReplyBudget moves to in progress", () => {
  const item = newAdaptiveReplyBudget("code-142", "name-889");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("AdaptiveReplyBudget rejects moves from cancelled", () => {
  const item = newAdaptiveReplyBudget("code-142", "name-889");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
