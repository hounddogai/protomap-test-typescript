import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementBaseline } from "./placement-baseline.js";

test("PlacementBaseline starts in proposed", () => {
  const item = newPlacementBaseline("code-828", "label-396");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementBaseline moves to rejected", () => {
  const item = newPlacementBaseline("code-828", "label-396");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PlacementBaseline rejects moves from withdrawn", () => {
  const item = newPlacementBaseline("code-828", "label-396");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
