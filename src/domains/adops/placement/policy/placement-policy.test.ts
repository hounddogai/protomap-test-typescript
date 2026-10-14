import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementPolicy } from "./placement-policy.js";

test("PlacementPolicy starts in open", () => {
  const item = newPlacementPolicy("code-754", "title-980");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementPolicy moves to reopened", () => {
  const item = newPlacementPolicy("code-754", "title-980");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PlacementPolicy rejects moves from archived", () => {
  const item = newPlacementPolicy("code-754", "title-980");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
