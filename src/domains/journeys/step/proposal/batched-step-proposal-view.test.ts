import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedStepProposalView, toBatchedStepProposalViews } from "./batched-step-proposal-view.js";
import { newBatchedStepProposal } from "./batched-step-proposal.js";

test("BatchedStepProposalView shows the status in capitals", () => {
  const item = newBatchedStepProposal("code-237", "name-973");
  const view = toBatchedStepProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedStepProposalViews([item, item]).length, 2, "views");
});
