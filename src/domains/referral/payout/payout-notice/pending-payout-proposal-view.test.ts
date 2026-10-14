import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingPayoutProposalView, toPendingPayoutProposalViews } from "./pending-payout-proposal-view.js";
import { newPendingPayoutProposal } from "./pending-payout-proposal.js";

test("PendingPayoutProposalView shows the status in capitals", () => {
  const item = newPendingPayoutProposal("code-61", "label-874");
  const view = toPendingPayoutProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingPayoutProposalViews([item, item]).length, 2, "views");
});
