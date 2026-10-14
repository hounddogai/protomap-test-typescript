import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementDigest } from "./placement-digest.js";

test("PlacementDigest starts in created", () => {
  const item = newPlacementDigest("code-583", "name-220");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementDigest moves to validated", () => {
  const item = newPlacementDigest("code-583", "name-220");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PlacementDigest rejects moves from retired", () => {
  const item = newPlacementDigest("code-583", "name-220");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
