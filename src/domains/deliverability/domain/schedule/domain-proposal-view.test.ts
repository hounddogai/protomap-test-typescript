import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainProposalView, toDomainProposalViews } from "./domain-proposal-view.js";
import { newDomainProposal } from "./domain-proposal.js";

test("DomainProposalView shows the status in capitals", () => {
  const item = newDomainProposal("code-919", "title-533");
  const view = toDomainProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainProposalViews([item, item]).length, 2, "views");
});
