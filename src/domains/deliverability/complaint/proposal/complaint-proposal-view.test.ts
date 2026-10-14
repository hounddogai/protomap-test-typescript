import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintProposalView, toComplaintProposalViews } from "./complaint-proposal-view.js";
import { newComplaintProposal } from "./complaint-proposal.js";

test("ComplaintProposalView shows the status in capitals", () => {
  const item = newComplaintProposal("code-146", "name-102");
  const view = toComplaintProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintProposalViews([item, item]).length, 2, "views");
});
