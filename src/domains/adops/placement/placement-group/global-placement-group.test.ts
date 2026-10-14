import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPlacementGroup } from "./global-placement-group.js";

test("GlobalPlacementGroup starts in planned", () => {
  const item = newGlobalPlacementGroup("code-113", "title-388");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPlacementGroup moves to scheduled", () => {
  const item = newGlobalPlacementGroup("code-113", "title-388");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("GlobalPlacementGroup rejects moves from cancelled", () => {
  const item = newGlobalPlacementGroup("code-113", "title-388");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
