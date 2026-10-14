import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalStreakProposalView, toRegionalStreakProposalViews } from "./regional-streak-proposal-view.js";
import { newRegionalStreakProposal } from "./regional-streak-proposal.js";

test("RegionalStreakProposalView shows the status in capitals", () => {
  const item = newRegionalStreakProposal("code-29", "label-354");
  const view = toRegionalStreakProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalStreakProposalViews([item, item]).length, 2, "views");
});
