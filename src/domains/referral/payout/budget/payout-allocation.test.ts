import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutAllocation } from "./payout-allocation.js";

test("PayoutAllocation starts in planned", () => {
  const item = newPayoutAllocation("code-821", "title-522");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutAllocation moves to scheduled", () => {
  const item = newPayoutAllocation("code-821", "title-522");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PayoutAllocation rejects moves from cancelled", () => {
  const item = newPayoutAllocation("code-821", "title-522");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
