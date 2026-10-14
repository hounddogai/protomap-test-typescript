import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryTierRollup } from "./primary-tier-rollup.js";

test("PrimaryTierRollup starts in planned", () => {
  const item = newPrimaryTierRollup("code-571", "label-527");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryTierRollup moves to completed", () => {
  const item = newPrimaryTierRollup("code-571", "label-527");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PrimaryTierRollup rejects moves from cancelled", () => {
  const item = newPrimaryTierRollup("code-571", "label-527");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
