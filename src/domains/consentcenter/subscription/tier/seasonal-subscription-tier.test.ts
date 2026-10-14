import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalSubscriptionTier } from "./seasonal-subscription-tier.js";

test("SeasonalSubscriptionTier starts in open", () => {
  const item = newSeasonalSubscriptionTier("code-759", "title-437");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalSubscriptionTier moves to reopened", () => {
  const item = newSeasonalSubscriptionTier("code-759", "title-437");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SeasonalSubscriptionTier rejects moves from archived", () => {
  const item = newSeasonalSubscriptionTier("code-759", "title-437");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
