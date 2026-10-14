import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionAssignment } from "./redemption-assignment.js";

test("RedemptionAssignment starts in planned", () => {
  const item = newRedemptionAssignment("code-274", "name-112");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionAssignment moves to in progress", () => {
  const item = newRedemptionAssignment("code-274", "name-112");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RedemptionAssignment rejects moves from cancelled", () => {
  const item = newRedemptionAssignment("code-274", "name-112");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
