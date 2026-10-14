import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientReputationProposal } from "./lenient-reputation-proposal.js";

test("LenientReputationProposal starts in open", () => {
  const item = newLenientReputationProposal("code-852", "label-360");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientReputationProposal moves to reopened", () => {
  const item = newLenientReputationProposal("code-852", "label-360");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("LenientReputationProposal rejects moves from archived", () => {
  const item = newLenientReputationProposal("code-852", "label-360");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
