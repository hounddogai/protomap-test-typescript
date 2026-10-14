import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedQueueProposalView, toBatchedQueueProposalViews } from "./batched-queue-proposal-view.js";
import { newBatchedQueueProposal } from "./batched-queue-proposal.js";

test("BatchedQueueProposalView shows the status in capitals", () => {
  const item = newBatchedQueueProposal("code-536", "title-557");
  const view = toBatchedQueueProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedQueueProposalViews([item, item]).length, 2, "views");
});
