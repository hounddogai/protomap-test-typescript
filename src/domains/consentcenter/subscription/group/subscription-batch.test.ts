import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionBatch } from "./subscription-batch.js";

test("SubscriptionBatch starts in planned", () => {
  const item = newSubscriptionBatch("code-108", "title-491");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionBatch moves to completed", () => {
  const item = newSubscriptionBatch("code-108", "title-491");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("SubscriptionBatch rejects moves from cancelled", () => {
  const item = newSubscriptionBatch("code-108", "title-491");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
