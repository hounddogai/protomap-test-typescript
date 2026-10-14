import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryDomainProposalView, toPrimaryDomainProposalViews } from "./primary-domain-proposal-view.js";
import { newPrimaryDomainProposal } from "./primary-domain-proposal.js";

test("PrimaryDomainProposalView shows the status in capitals", () => {
  const item = newPrimaryDomainProposal("code-773", "label-874");
  const view = toPrimaryDomainProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryDomainProposalViews([item, item]).length, 2, "views");
});
