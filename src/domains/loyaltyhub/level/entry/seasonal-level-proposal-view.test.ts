import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalLevelProposalView, toSeasonalLevelProposalViews } from "./seasonal-level-proposal-view.js";
import { newSeasonalLevelProposal } from "./seasonal-level-proposal.js";

test("SeasonalLevelProposalView shows the status in capitals", () => {
  const item = newSeasonalLevelProposal("code-234", "title-655");
  const view = toSeasonalLevelProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalLevelProposalViews([item, item]).length, 2, "views");
});
