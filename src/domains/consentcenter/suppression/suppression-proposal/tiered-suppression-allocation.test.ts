import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredSuppressionAllocation } from "./tiered-suppression-allocation.js";

test("TieredSuppressionAllocation starts in planned", () => {
  const item = newTieredSuppressionAllocation("code-233", "title-139");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredSuppressionAllocation moves to scheduled", () => {
  const item = newTieredSuppressionAllocation("code-233", "title-139");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TieredSuppressionAllocation rejects moves from cancelled", () => {
  const item = newTieredSuppressionAllocation("code-233", "title-139");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
