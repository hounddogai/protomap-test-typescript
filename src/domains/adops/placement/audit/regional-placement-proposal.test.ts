import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPlacementProposal } from "./regional-placement-proposal.js";

test("RegionalPlacementProposal starts in idle", () => {
  const item = newRegionalPlacementProposal("code-451", "label-688");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPlacementProposal moves to ready", () => {
  const item = newRegionalPlacementProposal("code-451", "label-688");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RegionalPlacementProposal rejects moves from stopped", () => {
  const item = newRegionalPlacementProposal("code-451", "label-688");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
