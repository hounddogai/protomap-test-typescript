import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSubscriptionNotice } from "./pending-subscription-notice.js";

test("PendingSubscriptionNotice starts in created", () => {
  const item = newPendingSubscriptionNotice("code-825", "name-652");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSubscriptionNotice moves to retired", () => {
  const item = newPendingSubscriptionNotice("code-825", "name-652");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PendingSubscriptionNotice rejects moves from retired", () => {
  const item = newPendingSubscriptionNotice("code-825", "name-652");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
