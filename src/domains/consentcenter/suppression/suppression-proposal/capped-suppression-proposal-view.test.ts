import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toCappedSuppressionProposalView,
  toCappedSuppressionProposalViews,
} from "./capped-suppression-proposal-view.js";
import { newCappedSuppressionProposal } from "./capped-suppression-proposal.js";

test("CappedSuppressionProposalView shows the status in capitals", () => {
  const item = newCappedSuppressionProposal("code-977", "label-938");
  const view = toCappedSuppressionProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedSuppressionProposalViews([item, item]).length, 2, "views");
});
