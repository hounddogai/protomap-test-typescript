import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionBudget } from "./redemption-budget.js";

test("RedemptionBudget starts in proposed", () => {
  const item = newRedemptionBudget("code-508", "title-345");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionBudget moves to approved", () => {
  const item = newRedemptionBudget("code-508", "title-345");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RedemptionBudget rejects moves from withdrawn", () => {
  const item = newRedemptionBudget("code-508", "title-345");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
