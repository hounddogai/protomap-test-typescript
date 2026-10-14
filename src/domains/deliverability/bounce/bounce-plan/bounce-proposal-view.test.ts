import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceProposalView, toBounceProposalViews } from "./bounce-proposal-view.js";
import { newBounceProposal } from "./bounce-proposal.js";

test("BounceProposalView shows the status in capitals", () => {
  const item = newBounceProposal("code-799", "label-264");
  const view = toBounceProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceProposalViews([item, item]).length, 2, "views");
});
