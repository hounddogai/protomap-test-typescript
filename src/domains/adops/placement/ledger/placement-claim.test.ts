import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementClaim } from "./placement-claim.js";

test("PlacementClaim starts in proposed", () => {
  const item = newPlacementClaim("code-392", "title-627");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementClaim moves to approved", () => {
  const item = newPlacementClaim("code-392", "title-627");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PlacementClaim rejects moves from withdrawn", () => {
  const item = newPlacementClaim("code-392", "title-627");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
