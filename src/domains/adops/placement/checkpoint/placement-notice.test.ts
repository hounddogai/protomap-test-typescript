import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementNotice } from "./placement-notice.js";

test("PlacementNotice starts in proposed", () => {
  const item = newPlacementNotice("code-314", "name-77");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementNotice moves to withdrawn", () => {
  const item = newPlacementNotice("code-314", "name-77");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PlacementNotice rejects moves from withdrawn", () => {
  const item = newPlacementNotice("code-314", "name-77");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
