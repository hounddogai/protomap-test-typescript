import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingPayoutProposal } from "./pending-payout-proposal.js";

test("PendingPayoutProposal starts in created", () => {
  const item = newPendingPayoutProposal("code-61", "label-874");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingPayoutProposal moves to published", () => {
  const item = newPendingPayoutProposal("code-61", "label-874");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PendingPayoutProposal rejects moves from retired", () => {
  const item = newPendingPayoutProposal("code-61", "label-874");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
