import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionRecord } from "./subscription-record.js";

test("SubscriptionRecord starts in planned", () => {
  const item = newSubscriptionRecord("code-192", "label-792");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionRecord moves to scheduled", () => {
  const item = newSubscriptionRecord("code-192", "label-792");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SubscriptionRecord rejects moves from cancelled", () => {
  const item = newSubscriptionRecord("code-192", "label-792");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
