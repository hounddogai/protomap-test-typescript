import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointProposalView, toTouchpointProposalViews } from "./touchpoint-proposal-view.js";
import { newTouchpointProposal } from "./touchpoint-proposal.js";

test("TouchpointProposalView shows the status in capitals", () => {
  const item = newTouchpointProposal("code-301", "name-423");
  const view = toTouchpointProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointProposalViews([item, item]).length, 2, "views");
});
