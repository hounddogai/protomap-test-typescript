import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTierCycle } from "./manual-tier-cycle.js";

test("ManualTierCycle starts in planned", () => {
  const item = newManualTierCycle("code-449", "name-62");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTierCycle moves to completed", () => {
  const item = newManualTierCycle("code-449", "name-62");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("ManualTierCycle rejects moves from cancelled", () => {
  const item = newManualTierCycle("code-449", "name-62");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
