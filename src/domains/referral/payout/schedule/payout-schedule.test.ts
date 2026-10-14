import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutSchedule } from "./payout-schedule.js";

test("PayoutSchedule starts in new", () => {
  const item = newPayoutSchedule("code-487", "name-241");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutSchedule moves to running", () => {
  const item = newPayoutSchedule("code-487", "name-241");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PayoutSchedule rejects moves from failed", () => {
  const item = newPayoutSchedule("code-487", "name-241");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
