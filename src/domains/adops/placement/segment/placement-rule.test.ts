import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementRule } from "./placement-rule.js";

test("PlacementRule starts in created", () => {
  const item = newPlacementRule("code-137", "label-367");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementRule moves to retired", () => {
  const item = newPlacementRule("code-137", "label-367");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PlacementRule rejects moves from retired", () => {
  const item = newPlacementRule("code-137", "label-367");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
