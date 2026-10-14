import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementScore } from "./placement-score.js";

test("PlacementScore starts in created", () => {
  const item = newPlacementScore("code-761", "name-77");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementScore moves to retired", () => {
  const item = newPlacementScore("code-761", "name-77");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PlacementScore rejects moves from retired", () => {
  const item = newPlacementScore("code-761", "name-77");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
