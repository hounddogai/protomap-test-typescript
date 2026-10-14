import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementSegment } from "./placement-segment.js";

test("PlacementSegment starts in proposed", () => {
  const item = newPlacementSegment("code-570", "title-712");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementSegment moves to approved", () => {
  const item = newPlacementSegment("code-570", "title-712");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PlacementSegment rejects moves from withdrawn", () => {
  const item = newPlacementSegment("code-570", "title-712");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
