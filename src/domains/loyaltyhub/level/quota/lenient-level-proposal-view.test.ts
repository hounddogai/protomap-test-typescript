import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientLevelProposalView, toLenientLevelProposalViews } from "./lenient-level-proposal-view.js";
import { newLenientLevelProposal } from "./lenient-level-proposal.js";

test("LenientLevelProposalView shows the status in capitals", () => {
  const item = newLenientLevelProposal("code-653", "label-259");
  const view = toLenientLevelProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientLevelProposalViews([item, item]).length, 2, "views");
});
