import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionProfile } from "./subscription-profile.js";

test("SubscriptionProfile starts in requested", () => {
  const item = newSubscriptionProfile("code-429", "name-596");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionProfile moves to granted", () => {
  const item = newSubscriptionProfile("code-429", "name-596");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SubscriptionProfile rejects moves from expired", () => {
  const item = newSubscriptionProfile("code-429", "name-596");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
