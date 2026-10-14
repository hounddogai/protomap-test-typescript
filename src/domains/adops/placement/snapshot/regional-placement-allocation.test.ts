import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPlacementAllocation } from "./regional-placement-allocation.js";

test("RegionalPlacementAllocation starts in open", () => {
  const item = newRegionalPlacementAllocation("code-837", "title-520");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPlacementAllocation moves to resolved", () => {
  const item = newRegionalPlacementAllocation("code-837", "title-520");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RegionalPlacementAllocation rejects moves from archived", () => {
  const item = newRegionalPlacementAllocation("code-837", "title-520");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
