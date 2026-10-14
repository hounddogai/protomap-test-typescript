import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualReputationProposalView,
  toManualReputationProposalViews,
} from "./manual-reputation-proposal-view.js";
import { newManualReputationProposal } from "./manual-reputation-proposal.js";

test("ManualReputationProposalView shows the status in capitals", () => {
  const item = newManualReputationProposal("code-483", "name-414");
  const view = toManualReputationProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualReputationProposalViews([item, item]).length, 2, "views");
});
