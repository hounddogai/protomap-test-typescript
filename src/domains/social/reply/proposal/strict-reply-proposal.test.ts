import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictReplyProposal } from "./strict-reply-proposal.js";

test("StrictReplyProposal starts in created", () => {
  const item = newStrictReplyProposal("code-710", "title-445");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictReplyProposal moves to retired", () => {
  const item = newStrictReplyProposal("code-710", "title-445");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("StrictReplyProposal rejects moves from retired", () => {
  const item = newStrictReplyProposal("code-710", "title-445");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
