import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionBaseline } from "./subscription-baseline.js";

test("SubscriptionBaseline starts in new", () => {
  const item = newSubscriptionBaseline("code-971", "label-358");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionBaseline moves to queued", () => {
  const item = newSubscriptionBaseline("code-971", "label-358");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SubscriptionBaseline rejects moves from failed", () => {
  const item = newSubscriptionBaseline("code-971", "label-358");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
