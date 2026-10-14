import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalActivationProposalView,
  toRegionalActivationProposalViews,
} from "./regional-activation-proposal-view.js";
import { newRegionalActivationProposal } from "./regional-activation-proposal.js";

test("RegionalActivationProposalView shows the status in capitals", () => {
  const item = newRegionalActivationProposal("code-430", "label-928");
  const view = toRegionalActivationProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalActivationProposalViews([item, item]).length, 2, "views");
});
