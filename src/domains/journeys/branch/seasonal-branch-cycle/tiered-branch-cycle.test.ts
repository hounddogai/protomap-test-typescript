import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBranchCycle } from "./tiered-branch-cycle.js";

test("TieredBranchCycle starts in planned", () => {
  const item = newTieredBranchCycle("code-667", "name-563");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBranchCycle moves to in progress", () => {
  const item = newTieredBranchCycle("code-667", "name-563");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("TieredBranchCycle rejects moves from cancelled", () => {
  const item = newTieredBranchCycle("code-667", "name-563");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
