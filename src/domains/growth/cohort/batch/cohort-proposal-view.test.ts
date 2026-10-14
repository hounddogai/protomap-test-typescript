import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortProposalView, toCohortProposalViews } from "./cohort-proposal-view.js";
import { newCohortProposal } from "./cohort-proposal.js";

test("CohortProposalView shows the status in capitals", () => {
  const item = newCohortProposal("code-168", "title-711");
  const view = toCohortProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortProposalViews([item, item]).length, 2, "views");
});
