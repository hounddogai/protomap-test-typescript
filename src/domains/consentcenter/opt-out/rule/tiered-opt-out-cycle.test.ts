import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredOptOutCycle } from "./tiered-opt-out-cycle.js";

test("TieredOptOutCycle starts in idle", () => {
  const item = newTieredOptOutCycle("code-691", "label-158");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredOptOutCycle moves to draining", () => {
  const item = newTieredOptOutCycle("code-691", "label-158");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TieredOptOutCycle rejects moves from stopped", () => {
  const item = newTieredOptOutCycle("code-691", "label-158");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
