import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyComplaintProposalView, toLegacyComplaintProposalViews } from "./legacy-complaint-proposal-view.js";
import { newLegacyComplaintProposal } from "./legacy-complaint-proposal.js";

test("LegacyComplaintProposalView shows the status in capitals", () => {
  const item = newLegacyComplaintProposal("code-368", "label-167");
  const view = toLegacyComplaintProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyComplaintProposalViews([item, item]).length, 2, "views");
});
