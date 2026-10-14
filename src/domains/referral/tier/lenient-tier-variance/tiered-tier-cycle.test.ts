import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredTierCycle } from "./tiered-tier-cycle.js";

test("TieredTierCycle starts in idle", () => {
  const item = newTieredTierCycle("code-861", "label-392");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredTierCycle moves to draining", () => {
  const item = newTieredTierCycle("code-861", "label-392");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TieredTierCycle rejects moves from stopped", () => {
  const item = newTieredTierCycle("code-861", "label-392");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
