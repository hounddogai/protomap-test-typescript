import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutCycle } from "./payout-cycle.js";

test("PayoutCycle starts in planned", () => {
  const item = newPayoutCycle("code-195", "title-636");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutCycle moves to scheduled", () => {
  const item = newPayoutCycle("code-195", "title-636");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PayoutCycle rejects moves from cancelled", () => {
  const item = newPayoutCycle("code-195", "title-636");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
