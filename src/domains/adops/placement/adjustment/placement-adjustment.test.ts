import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementAdjustment } from "./placement-adjustment.js";

test("PlacementAdjustment starts in created", () => {
  const item = newPlacementAdjustment("code-852", "label-552");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementAdjustment moves to validated", () => {
  const item = newPlacementAdjustment("code-852", "label-552");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PlacementAdjustment rejects moves from retired", () => {
  const item = newPlacementAdjustment("code-852", "label-552");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
