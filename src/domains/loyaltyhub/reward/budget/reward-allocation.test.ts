import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardAllocation } from "./reward-allocation.js";

test("RewardAllocation starts in requested", () => {
  const item = newRewardAllocation("code-824", "label-919");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardAllocation moves to granted", () => {
  const item = newRewardAllocation("code-824", "label-919");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RewardAllocation rejects moves from expired", () => {
  const item = newRewardAllocation("code-824", "label-919");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
