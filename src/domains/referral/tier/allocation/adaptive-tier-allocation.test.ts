import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveTierAllocation } from "./adaptive-tier-allocation.js";

test("AdaptiveTierAllocation starts in proposed", () => {
  const item = newAdaptiveTierAllocation("code-19", "name-266");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveTierAllocation moves to approved", () => {
  const item = newAdaptiveTierAllocation("code-19", "name-266");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("AdaptiveTierAllocation rejects moves from withdrawn", () => {
  const item = newAdaptiveTierAllocation("code-19", "name-266");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
