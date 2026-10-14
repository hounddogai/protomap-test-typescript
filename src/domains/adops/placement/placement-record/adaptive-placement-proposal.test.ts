import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePlacementProposal } from "./adaptive-placement-proposal.js";

test("AdaptivePlacementProposal starts in requested", () => {
  const item = newAdaptivePlacementProposal("code-768", "label-434");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePlacementProposal moves to revoked", () => {
  const item = newAdaptivePlacementProposal("code-768", "label-434");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("AdaptivePlacementProposal rejects moves from expired", () => {
  const item = newAdaptivePlacementProposal("code-768", "label-434");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
