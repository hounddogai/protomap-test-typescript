import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionAllocation } from "./redemption-allocation.js";

test("RedemptionAllocation starts in new", () => {
  const item = newRedemptionAllocation("code-126", "title-763");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionAllocation moves to queued", () => {
  const item = newRedemptionAllocation("code-126", "title-763");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RedemptionAllocation rejects moves from failed", () => {
  const item = newRedemptionAllocation("code-126", "title-763");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
