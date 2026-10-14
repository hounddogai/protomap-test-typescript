import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingFrequencyProposal } from "./pending-frequency-proposal.js";

test("PendingFrequencyProposal starts in draft", () => {
  const item = newPendingFrequencyProposal("code-274", "name-424");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingFrequencyProposal moves to pending", () => {
  const item = newPendingFrequencyProposal("code-274", "name-424");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PendingFrequencyProposal rejects moves from closed", () => {
  const item = newPendingFrequencyProposal("code-274", "name-424");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
