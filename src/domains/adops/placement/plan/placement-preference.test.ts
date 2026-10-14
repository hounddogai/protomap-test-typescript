import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementPreference } from "./placement-preference.js";

test("PlacementPreference starts in proposed", () => {
  const item = newPlacementPreference("code-853", "name-380");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementPreference moves to withdrawn", () => {
  const item = newPlacementPreference("code-853", "name-380");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PlacementPreference rejects moves from withdrawn", () => {
  const item = newPlacementPreference("code-853", "name-380");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
