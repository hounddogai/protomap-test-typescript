import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictSubscriptionBundle } from "./strict-subscription-bundle.js";

test("StrictSubscriptionBundle starts in open", () => {
  const item = newStrictSubscriptionBundle("code-866", "name-948");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictSubscriptionBundle moves to resolved", () => {
  const item = newStrictSubscriptionBundle("code-866", "name-948");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("StrictSubscriptionBundle rejects moves from archived", () => {
  const item = newStrictSubscriptionBundle("code-866", "name-948");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
