import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionNotice } from "./subscription-notice.js";

test("SubscriptionNotice starts in created", () => {
  const item = newSubscriptionNotice("code-804", "title-291");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionNotice moves to published", () => {
  const item = newSubscriptionNotice("code-804", "title-291");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("SubscriptionNotice rejects moves from retired", () => {
  const item = newSubscriptionNotice("code-804", "title-291");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
