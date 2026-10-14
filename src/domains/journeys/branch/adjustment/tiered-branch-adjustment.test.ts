import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBranchAdjustment } from "./tiered-branch-adjustment.js";

test("TieredBranchAdjustment starts in planned", () => {
  const item = newTieredBranchAdjustment("code-478", "label-795");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBranchAdjustment moves to scheduled", () => {
  const item = newTieredBranchAdjustment("code-478", "label-795");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TieredBranchAdjustment rejects moves from cancelled", () => {
  const item = newTieredBranchAdjustment("code-478", "label-795");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
