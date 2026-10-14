import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionCheckpoint } from "./subscription-checkpoint.js";

test("SubscriptionCheckpoint starts in created", () => {
  const item = newSubscriptionCheckpoint("code-628", "label-305");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionCheckpoint moves to validated", () => {
  const item = newSubscriptionCheckpoint("code-628", "label-305");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SubscriptionCheckpoint rejects moves from retired", () => {
  const item = newSubscriptionCheckpoint("code-628", "label-305");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
