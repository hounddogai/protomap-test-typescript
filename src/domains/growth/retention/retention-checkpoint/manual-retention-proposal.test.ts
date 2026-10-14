import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualRetentionProposal } from "./manual-retention-proposal.js";

test("ManualRetentionProposal starts in idle", () => {
  const item = newManualRetentionProposal("code-197", "title-453");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualRetentionProposal moves to warming", () => {
  const item = newManualRetentionProposal("code-197", "title-453");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ManualRetentionProposal rejects moves from stopped", () => {
  const item = newManualRetentionProposal("code-197", "title-453");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
