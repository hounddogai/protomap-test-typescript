import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyProposalView, toReplyProposalViews } from "./reply-proposal-view.js";
import { newReplyProposal } from "./reply-proposal.js";

test("ReplyProposalView shows the status in capitals", () => {
  const item = newReplyProposal("code-442", "name-933");
  const view = toReplyProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyProposalViews([item, item]).length, 2, "views");
});
