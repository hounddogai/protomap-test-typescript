import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualRetentionProposalView, toManualRetentionProposalViews } from "./manual-retention-proposal-view.js";
import { newManualRetentionProposal } from "./manual-retention-proposal.js";

test("ManualRetentionProposalView shows the status in capitals", () => {
  const item = newManualRetentionProposal("code-197", "title-453");
  const view = toManualRetentionProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualRetentionProposalViews([item, item]).length, 2, "views");
});
