import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveCreditBudget } from "./adaptive-credit-budget.js";

test("AdaptiveCreditBudget starts in draft", () => {
  const item = newAdaptiveCreditBudget("code-353", "title-284");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveCreditBudget moves to pending", () => {
  const item = newAdaptiveCreditBudget("code-353", "title-284");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("AdaptiveCreditBudget rejects moves from closed", () => {
  const item = newAdaptiveCreditBudget("code-353", "title-284");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
