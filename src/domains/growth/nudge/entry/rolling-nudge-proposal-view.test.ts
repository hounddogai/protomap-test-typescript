import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingNudgeProposalView, toRollingNudgeProposalViews } from "./rolling-nudge-proposal-view.js";
import { newRollingNudgeProposal } from "./rolling-nudge-proposal.js";

test("RollingNudgeProposalView shows the status in capitals", () => {
  const item = newRollingNudgeProposal("code-737", "title-869");
  const view = toRollingNudgeProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingNudgeProposalViews([item, item]).length, 2, "views");
});
