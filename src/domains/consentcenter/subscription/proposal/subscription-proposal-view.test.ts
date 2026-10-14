import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionProposalView, toSubscriptionProposalViews } from "./subscription-proposal-view.js";
import { newSubscriptionProposal } from "./subscription-proposal.js";

test("SubscriptionProposalView shows the status in capitals", () => {
  const item = newSubscriptionProposal("code-593", "label-174");
  const view = toSubscriptionProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionProposalViews([item, item]).length, 2, "views");
});
