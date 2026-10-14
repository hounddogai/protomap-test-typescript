import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutProposalView, toPayoutProposalViews } from "./payout-proposal-view.js";
import { newPayoutProposal } from "./payout-proposal.js";

test("PayoutProposalView shows the status in capitals", () => {
  const item = newPayoutProposal("code-689", "name-477");
  const view = toPayoutProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutProposalViews([item, item]).length, 2, "views");
});
