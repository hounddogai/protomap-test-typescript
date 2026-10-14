import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatProposalView, toCsatProposalViews } from "./csat-proposal-view.js";
import { newCsatProposal } from "./csat-proposal.js";

test("CsatProposalView shows the status in capitals", () => {
  const item = newCsatProposal("code-325", "label-347");
  const view = toCsatProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatProposalViews([item, item]).length, 2, "views");
});
