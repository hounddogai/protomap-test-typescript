import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientCreditProposalView, toLenientCreditProposalViews } from "./lenient-credit-proposal-view.js";
import { newLenientCreditProposal } from "./lenient-credit-proposal.js";

test("LenientCreditProposalView shows the status in capitals", () => {
  const item = newLenientCreditProposal("code-125", "title-10");
  const view = toLenientCreditProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientCreditProposalViews([item, item]).length, 2, "views");
});
