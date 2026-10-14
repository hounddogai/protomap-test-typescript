import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePayoutAssignment } from "./adaptive-payout-assignment.js";

test("AdaptivePayoutAssignment starts in open", () => {
  const item = newAdaptivePayoutAssignment("code-554", "title-207");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePayoutAssignment moves to in review", () => {
  const item = newAdaptivePayoutAssignment("code-554", "title-207");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("AdaptivePayoutAssignment rejects moves from archived", () => {
  const item = newAdaptivePayoutAssignment("code-554", "title-207");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
