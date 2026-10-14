import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionMilestone } from "./subscription-milestone.js";

test("SubscriptionMilestone starts in planned", () => {
  const item = newSubscriptionMilestone("code-163", "title-699");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionMilestone moves to in progress", () => {
  const item = newSubscriptionMilestone("code-163", "title-699");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("SubscriptionMilestone rejects moves from cancelled", () => {
  const item = newSubscriptionMilestone("code-163", "title-699");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
