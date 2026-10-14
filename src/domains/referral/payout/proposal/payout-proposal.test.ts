import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutProposal } from "./payout-proposal.js";

test("PayoutProposal starts in idle", () => {
  const item = newPayoutProposal("code-689", "name-477");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutProposal moves to warming", () => {
  const item = newPayoutProposal("code-689", "name-477");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PayoutProposal rejects moves from stopped", () => {
  const item = newPayoutProposal("code-689", "name-477");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
