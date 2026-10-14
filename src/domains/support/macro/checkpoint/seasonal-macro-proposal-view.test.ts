import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalMacroProposalView, toSeasonalMacroProposalViews } from "./seasonal-macro-proposal-view.js";
import { newSeasonalMacroProposal } from "./seasonal-macro-proposal.js";

test("SeasonalMacroProposalView shows the status in capitals", () => {
  const item = newSeasonalMacroProposal("code-8", "name-462");
  const view = toSeasonalMacroProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalMacroProposalViews([item, item]).length, 2, "views");
});
