import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPaywallReview } from "./rolling-paywall-review.js";

test("RollingPaywallReview starts in idle", () => {
  const item = newRollingPaywallReview("code-688", "title-150");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPaywallReview moves to warming", () => {
  const item = newRollingPaywallReview("code-688", "title-150");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RollingPaywallReview rejects moves from stopped", () => {
  const item = newRollingPaywallReview("code-688", "title-150");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
