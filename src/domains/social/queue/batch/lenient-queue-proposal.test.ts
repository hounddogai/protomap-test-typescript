import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientQueueProposal } from "./lenient-queue-proposal.js";

test("LenientQueueProposal starts in draft", () => {
  const item = newLenientQueueProposal("code-144", "name-372");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientQueueProposal moves to active", () => {
  const item = newLenientQueueProposal("code-144", "name-372");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("LenientQueueProposal rejects moves from closed", () => {
  const item = newLenientQueueProposal("code-144", "name-372");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
