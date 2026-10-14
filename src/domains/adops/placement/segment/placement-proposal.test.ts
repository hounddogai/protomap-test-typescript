import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementProposal } from "./placement-proposal.js";

test("PlacementProposal starts in proposed", () => {
  const item = newPlacementProposal("code-956", "title-708");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementProposal moves to approved", () => {
  const item = newPlacementProposal("code-956", "title-708");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PlacementProposal rejects moves from withdrawn", () => {
  const item = newPlacementProposal("code-956", "title-708");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
