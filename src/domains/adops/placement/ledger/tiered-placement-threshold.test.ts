import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPlacementThreshold } from "./tiered-placement-threshold.js";

test("TieredPlacementThreshold starts in created", () => {
  const item = newTieredPlacementThreshold("code-274", "name-177");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPlacementThreshold moves to validated", () => {
  const item = newTieredPlacementThreshold("code-274", "name-177");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TieredPlacementThreshold rejects moves from retired", () => {
  const item = newTieredPlacementThreshold("code-274", "name-177");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
