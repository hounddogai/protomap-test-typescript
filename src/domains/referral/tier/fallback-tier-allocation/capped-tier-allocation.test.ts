import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedTierAllocation } from "./capped-tier-allocation.js";

test("CappedTierAllocation starts in planned", () => {
  const item = newCappedTierAllocation("code-74", "title-239");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedTierAllocation moves to completed", () => {
  const item = newCappedTierAllocation("code-74", "title-239");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("CappedTierAllocation rejects moves from cancelled", () => {
  const item = newCappedTierAllocation("code-74", "title-239");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
