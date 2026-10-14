import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionException } from "./subscription-exception.js";

test("SubscriptionException starts in proposed", () => {
  const item = newSubscriptionException("code-971", "label-160");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionException moves to withdrawn", () => {
  const item = newSubscriptionException("code-971", "label-160");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("SubscriptionException rejects moves from withdrawn", () => {
  const item = newSubscriptionException("code-971", "label-160");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
