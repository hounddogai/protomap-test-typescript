import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingRewardProposalView, toPendingRewardProposalViews } from "./pending-reward-proposal-view.js";
import { newPendingRewardProposal } from "./pending-reward-proposal.js";

test("PendingRewardProposalView shows the status in capitals", () => {
  const item = newPendingRewardProposal("code-589", "name-568");
  const view = toPendingRewardProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingRewardProposalViews([item, item]).length, 2, "views");
});
