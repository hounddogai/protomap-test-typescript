import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictSenderProposalView, toStrictSenderProposalViews } from "./strict-sender-proposal-view.js";
import { newStrictSenderProposal } from "./strict-sender-proposal.js";

test("StrictSenderProposalView shows the status in capitals", () => {
  const item = newStrictSenderProposal("code-381", "name-745");
  const view = toStrictSenderProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictSenderProposalViews([item, item]).length, 2, "views");
});
