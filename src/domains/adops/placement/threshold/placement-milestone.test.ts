import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementMilestone } from "./placement-milestone.js";

test("PlacementMilestone starts in proposed", () => {
  const item = newPlacementMilestone("code-46", "name-983");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementMilestone moves to approved", () => {
  const item = newPlacementMilestone("code-46", "name-983");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PlacementMilestone rejects moves from withdrawn", () => {
  const item = newPlacementMilestone("code-46", "name-983");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
