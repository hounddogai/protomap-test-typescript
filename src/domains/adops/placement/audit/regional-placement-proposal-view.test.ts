import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalPlacementProposalView,
  toRegionalPlacementProposalViews,
} from "./regional-placement-proposal-view.js";
import { newRegionalPlacementProposal } from "./regional-placement-proposal.js";

test("RegionalPlacementProposalView shows the status in capitals", () => {
  const item = newRegionalPlacementProposal("code-451", "label-688");
  const view = toRegionalPlacementProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalPlacementProposalViews([item, item]).length, 2, "views");
});
