import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationProposalView, toActivationProposalViews } from "./activation-proposal-view.js";
import { newActivationProposal } from "./activation-proposal.js";

test("ActivationProposalView shows the status in capitals", () => {
  const item = newActivationProposal("code-696", "label-541");
  const view = toActivationProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationProposalViews([item, item]).length, 2, "views");
});
