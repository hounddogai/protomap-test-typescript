import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalCsatProposalView, toRegionalCsatProposalViews } from "./regional-csat-proposal-view.js";
import { newRegionalCsatProposal } from "./regional-csat-proposal.js";

test("RegionalCsatProposalView shows the status in capitals", () => {
  const item = newRegionalCsatProposal("code-636", "label-121");
  const view = toRegionalCsatProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalCsatProposalViews([item, item]).length, 2, "views");
});
