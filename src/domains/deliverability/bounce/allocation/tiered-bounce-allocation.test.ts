import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBounceAllocation } from "./tiered-bounce-allocation.js";

test("TieredBounceAllocation starts in new", () => {
  const item = newTieredBounceAllocation("code-603", "name-26");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBounceAllocation moves to running", () => {
  const item = newTieredBounceAllocation("code-603", "name-26");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("TieredBounceAllocation rejects moves from failed", () => {
  const item = newTieredBounceAllocation("code-603", "name-26");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
