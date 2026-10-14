import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostProposalView, toPostProposalViews } from "./post-proposal-view.js";
import { newPostProposal } from "./post-proposal.js";

test("PostProposalView shows the status in capitals", () => {
  const item = newPostProposal("code-172", "label-787");
  const view = toPostProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostProposalViews([item, item]).length, 2, "views");
});
