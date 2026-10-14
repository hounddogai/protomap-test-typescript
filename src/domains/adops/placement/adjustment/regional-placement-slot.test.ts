import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPlacementSlot } from "./regional-placement-slot.js";

test("RegionalPlacementSlot starts in open", () => {
  const item = newRegionalPlacementSlot("code-714", "title-928");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPlacementSlot moves to in review", () => {
  const item = newRegionalPlacementSlot("code-714", "title-928");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RegionalPlacementSlot rejects moves from archived", () => {
  const item = newRegionalPlacementSlot("code-714", "title-928");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
