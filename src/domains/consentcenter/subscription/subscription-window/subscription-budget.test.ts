import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionBudget } from "./subscription-budget.js";

test("SubscriptionBudget starts in planned", () => {
  const item = newSubscriptionBudget("code-790", "title-135");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionBudget moves to scheduled", () => {
  const item = newSubscriptionBudget("code-790", "title-135");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SubscriptionBudget rejects moves from cancelled", () => {
  const item = newSubscriptionBudget("code-790", "title-135");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
