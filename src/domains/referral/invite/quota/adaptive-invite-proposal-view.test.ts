import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveInviteProposalView, toAdaptiveInviteProposalViews } from "./adaptive-invite-proposal-view.js";
import { newAdaptiveInviteProposal } from "./adaptive-invite-proposal.js";

test("AdaptiveInviteProposalView shows the status in capitals", () => {
  const item = newAdaptiveInviteProposal("code-574", "title-311");
  const view = toAdaptiveInviteProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveInviteProposalViews([item, item]).length, 2, "views");
});
