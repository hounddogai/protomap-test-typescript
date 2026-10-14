import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualSubscriptionTier } from "./manual-subscription-tier.js";

test("ManualSubscriptionTier starts in created", () => {
  const item = newManualSubscriptionTier("code-294", "label-202");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualSubscriptionTier moves to published", () => {
  const item = newManualSubscriptionTier("code-294", "label-202");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ManualSubscriptionTier rejects moves from retired", () => {
  const item = newManualSubscriptionTier("code-294", "label-202");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
