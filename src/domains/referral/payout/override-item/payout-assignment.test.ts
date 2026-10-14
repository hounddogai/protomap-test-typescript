import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutAssignment } from "./payout-assignment.js";

test("PayoutAssignment starts in new", () => {
  const item = newPayoutAssignment("code-153", "label-618");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutAssignment moves to queued", () => {
  const item = newPayoutAssignment("code-153", "label-618");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PayoutAssignment rejects moves from failed", () => {
  const item = newPayoutAssignment("code-153", "label-618");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
