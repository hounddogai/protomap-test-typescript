import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalRewardRollup } from "./regional-reward-rollup.js";

test("RegionalRewardRollup starts in planned", () => {
  const item = newRegionalRewardRollup("code-922", "title-142");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalRewardRollup moves to completed", () => {
  const item = newRegionalRewardRollup("code-922", "title-142");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("RegionalRewardRollup rejects moves from cancelled", () => {
  const item = newRegionalRewardRollup("code-922", "title-142");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
