import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyProposal } from "./reply-proposal.js";

test("ReplyProposal starts in draft", () => {
  const item = newReplyProposal("code-442", "name-933");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyProposal moves to suspended", () => {
  const item = newReplyProposal("code-442", "name-933");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ReplyProposal rejects moves from closed", () => {
  const item = newReplyProposal("code-442", "name-933");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
