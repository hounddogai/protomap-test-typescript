import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveComplaintProposal } from "./adaptive-complaint-proposal.js";

test("AdaptiveComplaintProposal starts in draft", () => {
  const item = newAdaptiveComplaintProposal("code-413", "label-355");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveComplaintProposal moves to suspended", () => {
  const item = newAdaptiveComplaintProposal("code-413", "label-355");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("AdaptiveComplaintProposal rejects moves from closed", () => {
  const item = newAdaptiveComplaintProposal("code-413", "label-355");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
