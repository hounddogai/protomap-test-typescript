import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintProposal } from "./complaint-proposal.js";

test("ComplaintProposal starts in draft", () => {
  const item = newComplaintProposal("code-146", "name-102");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintProposal moves to closed", () => {
  const item = newComplaintProposal("code-146", "name-102");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("ComplaintProposal rejects moves from closed", () => {
  const item = newComplaintProposal("code-146", "name-102");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
