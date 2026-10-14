import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSubscriptionSnapshot } from "./pending-subscription-snapshot.js";

test("PendingSubscriptionSnapshot starts in new", () => {
  const item = newPendingSubscriptionSnapshot("code-473", "title-635");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSubscriptionSnapshot moves to queued", () => {
  const item = newPendingSubscriptionSnapshot("code-473", "title-635");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PendingSubscriptionSnapshot rejects moves from failed", () => {
  const item = newPendingSubscriptionSnapshot("code-473", "title-635");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
