import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPayoutAssignment } from "./legacy-payout-assignment.js";

test("LegacyPayoutAssignment starts in new", () => {
  const item = newLegacyPayoutAssignment("code-222", "label-378");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPayoutAssignment moves to queued", () => {
  const item = newLegacyPayoutAssignment("code-222", "label-378");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LegacyPayoutAssignment rejects moves from failed", () => {
  const item = newLegacyPayoutAssignment("code-222", "label-378");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
