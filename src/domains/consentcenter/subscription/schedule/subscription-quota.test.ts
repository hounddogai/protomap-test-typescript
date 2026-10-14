import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionQuota } from "./subscription-quota.js";

test("SubscriptionQuota starts in requested", () => {
  const item = newSubscriptionQuota("code-698", "label-52");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionQuota moves to granted", () => {
  const item = newSubscriptionQuota("code-698", "label-52");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SubscriptionQuota rejects moves from expired", () => {
  const item = newSubscriptionQuota("code-698", "label-52");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
