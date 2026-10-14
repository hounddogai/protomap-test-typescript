import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementBundle } from "./placement-bundle.js";

test("PlacementBundle starts in new", () => {
  const item = newPlacementBundle("code-326", "label-434");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementBundle moves to running", () => {
  const item = newPlacementBundle("code-326", "label-434");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PlacementBundle rejects moves from failed", () => {
  const item = newPlacementBundle("code-326", "label-434");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
