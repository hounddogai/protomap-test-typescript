import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionTier } from "./subscription-tier.js";

test("SubscriptionTier starts in proposed", () => {
  const item = newSubscriptionTier("code-913", "label-534");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionTier moves to withdrawn", () => {
  const item = newSubscriptionTier("code-913", "label-534");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("SubscriptionTier rejects moves from withdrawn", () => {
  const item = newSubscriptionTier("code-913", "label-534");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
