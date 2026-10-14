import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckProposalView, toFraudCheckProposalViews } from "./fraud-check-proposal-view.js";
import { newFraudCheckProposal } from "./fraud-check-proposal.js";

test("FraudCheckProposalView shows the status in capitals", () => {
  const item = newFraudCheckProposal("code-990", "label-343");
  const view = toFraudCheckProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckProposalViews([item, item]).length, 2, "views");
});
