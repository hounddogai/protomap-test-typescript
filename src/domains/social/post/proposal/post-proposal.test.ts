import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostProposal } from "./post-proposal.js";

test("PostProposal starts in new", () => {
  const item = newPostProposal("code-172", "label-787");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostProposal moves to queued", () => {
  const item = newPostProposal("code-172", "label-787");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PostProposal rejects moves from failed", () => {
  const item = newPostProposal("code-172", "label-787");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
