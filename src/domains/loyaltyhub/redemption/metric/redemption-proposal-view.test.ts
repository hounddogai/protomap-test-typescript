import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionProposalView, toRedemptionProposalViews } from "./redemption-proposal-view.js";
import { newRedemptionProposal } from "./redemption-proposal.js";

test("RedemptionProposalView shows the status in capitals", () => {
  const item = newRedemptionProposal("code-209", "label-653");
  const view = toRedemptionProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionProposalViews([item, item]).length, 2, "views");
});
