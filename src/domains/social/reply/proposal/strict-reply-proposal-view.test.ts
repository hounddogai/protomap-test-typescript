import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictReplyProposalView, toStrictReplyProposalViews } from "./strict-reply-proposal-view.js";
import { newStrictReplyProposal } from "./strict-reply-proposal.js";

test("StrictReplyProposalView shows the status in capitals", () => {
  const item = newStrictReplyProposal("code-710", "title-445");
  const view = toStrictReplyProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictReplyProposalViews([item, item]).length, 2, "views");
});
