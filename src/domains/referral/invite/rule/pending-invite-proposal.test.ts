import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingInviteProposal } from "./pending-invite-proposal.js";

test("PendingInviteProposal starts in idle", () => {
  const item = newPendingInviteProposal("code-176", "title-578");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingInviteProposal moves to ready", () => {
  const item = newPendingInviteProposal("code-176", "title-578");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PendingInviteProposal rejects moves from stopped", () => {
  const item = newPendingInviteProposal("code-176", "title-578");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
