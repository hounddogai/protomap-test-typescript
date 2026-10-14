import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingInviteProposalView, toPendingInviteProposalViews } from "./pending-invite-proposal-view.js";
import { newPendingInviteProposal } from "./pending-invite-proposal.js";

test("PendingInviteProposalView shows the status in capitals", () => {
  const item = newPendingInviteProposal("code-176", "title-578");
  const view = toPendingInviteProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingInviteProposalViews([item, item]).length, 2, "views");
});
