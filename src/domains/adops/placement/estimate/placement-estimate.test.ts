import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementEstimate } from "./placement-estimate.js";

test("PlacementEstimate starts in created", () => {
  const item = newPlacementEstimate("code-702", "label-955");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementEstimate moves to retired", () => {
  const item = newPlacementEstimate("code-702", "label-955");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PlacementEstimate rejects moves from retired", () => {
  const item = newPlacementEstimate("code-702", "label-955");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
