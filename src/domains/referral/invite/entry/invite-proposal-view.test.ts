import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteProposalView, toInviteProposalViews } from "./invite-proposal-view.js";
import { newInviteProposal } from "./invite-proposal.js";

test("InviteProposalView shows the status in capitals", () => {
  const item = newInviteProposal("code-958", "title-311");
  const view = toInviteProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteProposalViews([item, item]).length, 2, "views");
});
