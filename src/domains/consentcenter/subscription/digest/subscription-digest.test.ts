import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionDigest } from "./subscription-digest.js";

test("SubscriptionDigest starts in requested", () => {
  const item = newSubscriptionDigest("code-640", "name-286");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionDigest moves to granted", () => {
  const item = newSubscriptionDigest("code-640", "name-286");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SubscriptionDigest rejects moves from expired", () => {
  const item = newSubscriptionDigest("code-640", "name-286");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
