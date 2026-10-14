import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationProposalView, toReputationProposalViews } from "./reputation-proposal-view.js";
import { newReputationProposal } from "./reputation-proposal.js";

test("ReputationProposalView shows the status in capitals", () => {
  const item = newReputationProposal("code-997", "label-137");
  const view = toReputationProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationProposalViews([item, item]).length, 2, "views");
});
