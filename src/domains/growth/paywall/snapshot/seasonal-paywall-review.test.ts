import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPaywallReview } from "./seasonal-paywall-review.js";

test("SeasonalPaywallReview starts in open", () => {
  const item = newSeasonalPaywallReview("code-710", "name-269");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPaywallReview moves to reopened", () => {
  const item = newSeasonalPaywallReview("code-710", "name-269");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SeasonalPaywallReview rejects moves from archived", () => {
  const item = newSeasonalPaywallReview("code-710", "name-269");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
