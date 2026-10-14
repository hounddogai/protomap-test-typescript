import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientNudgeProposalView, toLenientNudgeProposalViews } from "./lenient-nudge-proposal-view.js";
import { newLenientNudgeProposal } from "./lenient-nudge-proposal.js";

test("LenientNudgeProposalView shows the status in capitals", () => {
  const item = newLenientNudgeProposal("code-837", "name-42");
  const view = toLenientNudgeProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientNudgeProposalViews([item, item]).length, 2, "views");
});
