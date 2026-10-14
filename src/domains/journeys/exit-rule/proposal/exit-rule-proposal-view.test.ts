import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleProposalView, toExitRuleProposalViews } from "./exit-rule-proposal-view.js";
import { newExitRuleProposal } from "./exit-rule-proposal.js";

test("ExitRuleProposalView shows the status in capitals", () => {
  const item = newExitRuleProposal("code-123", "name-544");
  const view = toExitRuleProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleProposalViews([item, item]).length, 2, "views");
});
