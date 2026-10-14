import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierAllocation } from "./tier-allocation.js";

test("TierAllocation starts in proposed", () => {
  const item = newTierAllocation("code-488", "name-422");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierAllocation moves to approved", () => {
  const item = newTierAllocation("code-488", "name-422");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TierAllocation rejects moves from withdrawn", () => {
  const item = newTierAllocation("code-488", "name-422");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
