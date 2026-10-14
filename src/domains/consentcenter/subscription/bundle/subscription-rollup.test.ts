import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionRollup } from "./subscription-rollup.js";

test("SubscriptionRollup starts in open", () => {
  const item = newSubscriptionRollup("code-252", "name-940");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionRollup moves to in review", () => {
  const item = newSubscriptionRollup("code-252", "name-940");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SubscriptionRollup rejects moves from archived", () => {
  const item = newSubscriptionRollup("code-252", "name-940");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
