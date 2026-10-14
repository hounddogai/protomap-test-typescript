import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionMilestone } from "./redemption-milestone.js";

test("RedemptionMilestone starts in idle", () => {
  const item = newRedemptionMilestone("code-466", "name-767");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionMilestone moves to warming", () => {
  const item = newRedemptionMilestone("code-466", "name-767");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RedemptionMilestone rejects moves from stopped", () => {
  const item = newRedemptionMilestone("code-466", "name-767");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
