import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualRedemptionAssignment } from "./manual-redemption-assignment.js";

test("ManualRedemptionAssignment starts in open", () => {
  const item = newManualRedemptionAssignment("code-119", "label-501");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualRedemptionAssignment moves to resolved", () => {
  const item = newManualRedemptionAssignment("code-119", "label-501");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ManualRedemptionAssignment rejects moves from archived", () => {
  const item = newManualRedemptionAssignment("code-119", "label-501");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
