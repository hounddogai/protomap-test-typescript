import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementSummary } from "./placement-summary.js";

test("PlacementSummary starts in new", () => {
  const item = newPlacementSummary("code-36", "label-911");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementSummary moves to failed", () => {
  const item = newPlacementSummary("code-36", "label-911");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("PlacementSummary rejects moves from failed", () => {
  const item = newPlacementSummary("code-36", "label-911");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
