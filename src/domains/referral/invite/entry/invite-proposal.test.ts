import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteProposal } from "./invite-proposal.js";

test("InviteProposal starts in open", () => {
  const item = newInviteProposal("code-958", "title-311");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteProposal moves to reopened", () => {
  const item = newInviteProposal("code-958", "title-311");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("InviteProposal rejects moves from archived", () => {
  const item = newInviteProposal("code-958", "title-311");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
