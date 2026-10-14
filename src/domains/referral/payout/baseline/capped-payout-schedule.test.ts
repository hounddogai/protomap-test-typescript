import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedPayoutSchedule } from "./capped-payout-schedule.js";

test("CappedPayoutSchedule starts in idle", () => {
  const item = newCappedPayoutSchedule("code-871", "name-311");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedPayoutSchedule moves to ready", () => {
  const item = newCappedPayoutSchedule("code-871", "name-311");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("CappedPayoutSchedule rejects moves from stopped", () => {
  const item = newCappedPayoutSchedule("code-871", "name-311");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
