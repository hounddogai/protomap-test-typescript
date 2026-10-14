import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyExitRuleProposalView, toLegacyExitRuleProposalViews } from "./legacy-exit-rule-proposal-view.js";
import { newLegacyExitRuleProposal } from "./legacy-exit-rule-proposal.js";

test("LegacyExitRuleProposalView shows the status in capitals", () => {
  const item = newLegacyExitRuleProposal("code-734", "title-175");
  const view = toLegacyExitRuleProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyExitRuleProposalViews([item, item]).length, 2, "views");
});
