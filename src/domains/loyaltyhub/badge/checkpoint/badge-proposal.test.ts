import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeProposal } from "./badge-proposal.js";

test("BadgeProposal starts in draft", () => {
  const item = newBadgeProposal("code-244", "title-23");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeProposal moves to pending", () => {
  const item = newBadgeProposal("code-244", "title-23");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BadgeProposal rejects moves from closed", () => {
  const item = newBadgeProposal("code-244", "title-23");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
