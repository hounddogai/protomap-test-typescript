import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPlacementRecord } from "./tiered-placement-record.js";

test("TieredPlacementRecord starts in created", () => {
  const item = newTieredPlacementRecord("code-104", "name-892");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPlacementRecord moves to published", () => {
  const item = newTieredPlacementRecord("code-104", "name-892");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TieredPlacementRecord rejects moves from retired", () => {
  const item = newTieredPlacementRecord("code-104", "name-892");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
