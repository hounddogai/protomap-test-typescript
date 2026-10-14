import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyComplaintProposal } from "./legacy-complaint-proposal.js";

test("LegacyComplaintProposal starts in requested", () => {
  const item = newLegacyComplaintProposal("code-368", "label-167");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyComplaintProposal moves to granted", () => {
  const item = newLegacyComplaintProposal("code-368", "label-167");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LegacyComplaintProposal rejects moves from expired", () => {
  const item = newLegacyComplaintProposal("code-368", "label-167");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
