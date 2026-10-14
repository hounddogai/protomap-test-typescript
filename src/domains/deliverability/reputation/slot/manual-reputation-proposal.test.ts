import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualReputationProposal } from "./manual-reputation-proposal.js";

test("ManualReputationProposal starts in requested", () => {
  const item = newManualReputationProposal("code-483", "name-414");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualReputationProposal moves to revoked", () => {
  const item = newManualReputationProposal("code-483", "name-414");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ManualReputationProposal rejects moves from expired", () => {
  const item = newManualReputationProposal("code-483", "name-414");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
