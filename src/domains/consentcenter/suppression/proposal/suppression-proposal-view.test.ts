import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionProposalView, toSuppressionProposalViews } from "./suppression-proposal-view.js";
import { newSuppressionProposal } from "./suppression-proposal.js";

test("SuppressionProposalView shows the status in capitals", () => {
  const item = newSuppressionProposal("code-861", "name-239");
  const view = toSuppressionProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionProposalViews([item, item]).length, 2, "views");
});
