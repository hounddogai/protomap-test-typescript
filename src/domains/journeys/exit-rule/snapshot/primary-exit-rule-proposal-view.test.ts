import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryExitRuleProposalView, toPrimaryExitRuleProposalViews } from "./primary-exit-rule-proposal-view.js";
import { newPrimaryExitRuleProposal } from "./primary-exit-rule-proposal.js";

test("PrimaryExitRuleProposalView shows the status in capitals", () => {
  const item = newPrimaryExitRuleProposal("code-466", "name-288");
  const view = toPrimaryExitRuleProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryExitRuleProposalViews([item, item]).length, 2, "views");
});
