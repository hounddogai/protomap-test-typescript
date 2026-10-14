import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceProposal } from "./bounce-proposal.js";

test("BounceProposal starts in planned", () => {
  const item = newBounceProposal("code-799", "label-264");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceProposal moves to cancelled", () => {
  const item = newBounceProposal("code-799", "label-264");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("BounceProposal rejects moves from cancelled", () => {
  const item = newBounceProposal("code-799", "label-264");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
