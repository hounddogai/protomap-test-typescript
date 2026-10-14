import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutCheckpoint } from "./payout-checkpoint.js";

test("PayoutCheckpoint starts in open", () => {
  const item = newPayoutCheckpoint("code-277", "name-626");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutCheckpoint moves to in review", () => {
  const item = newPayoutCheckpoint("code-277", "name-626");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PayoutCheckpoint rejects moves from archived", () => {
  const item = newPayoutCheckpoint("code-277", "name-626");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
