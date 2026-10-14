import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveInviteProposal } from "./adaptive-invite-proposal.js";

test("AdaptiveInviteProposal starts in open", () => {
  const item = newAdaptiveInviteProposal("code-574", "title-311");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveInviteProposal moves to resolved", () => {
  const item = newAdaptiveInviteProposal("code-574", "title-311");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("AdaptiveInviteProposal rejects moves from archived", () => {
  const item = newAdaptiveInviteProposal("code-574", "title-311");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
